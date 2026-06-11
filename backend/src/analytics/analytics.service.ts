import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const currentDate = new Date();
    const thisMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const thisYearStart = new Date(currentDate.getFullYear(), 0, 1);

    // 1. Fetch all user invoices
    const allInvoices = await this.prisma.invoice.findMany({
      where: { userId },
      include: {
        store: true,
        items: {
          include: { category: true },
        },
      },
    });

    // 2. Calculate totals
    const totalSpentAllTime = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalInvoicesCount = allInvoices.length;

    const monthlyInvoices = allInvoices.filter(inv => inv.date >= thisMonthStart);
    const totalSpentThisMonth = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const monthlyInvoicesCount = monthlyInvoices.length;

    const yearlyInvoices = allInvoices.filter(inv => inv.date >= thisYearStart);
    const totalSpentThisYear = yearlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // 3. Count total items bought
    const totalItemsCount = allInvoices.reduce((sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity, 0), 0);

    // 4. Breakdown by Category (Current month vs all-time)
    const categoryTotals: Record<string, { name: string; color: string; icon: string; amount: number }> = {};
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const cat = item.category;
        if (!categoryTotals[cat.id]) {
          categoryTotals[cat.id] = { name: cat.name, color: cat.color, icon: cat.icon, amount: 0 };
        }
        categoryTotals[cat.id].amount += item.netPrice;
      });
    });

    const categoryBreakdown = Object.values(categoryTotals)
      .map(c => ({ ...c, amount: parseFloat(c.amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Breakdown by Store (All-time)
    const storeTotals: Record<string, { name: string; amount: number; count: number }> = {};
    allInvoices.forEach(inv => {
      const store = inv.store;
      if (!storeTotals[store.id]) {
        storeTotals[store.id] = { name: store.name, amount: 0, count: 0 };
      }
      storeTotals[store.id].amount += inv.totalAmount;
      storeTotals[store.id].count += 1;
    });

    const storeBreakdown = Object.values(storeTotals)
      .map(s => ({
        ...s,
        amount: parseFloat(s.amount.toFixed(2)),
        percentage: totalSpentAllTime > 0 ? parseFloat(((s.amount / totalSpentAllTime) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // 6. Calculate Savings Index (Indice d'économie)
    // For every product, find the minimum recorded price in the DB.
    // Calculate how much the user would have saved if they had bought every item at the lowest recorded price.
    
    // Get all items in the database to find the min price of each product name
    const allDatabaseItems = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: { userId }
      },
      select: {
        productName: true,
        unitPrice: true,
      }
    });

    const minProductPrices: Record<string, number> = {};
    allDatabaseItems.forEach(item => {
      const name = item.productName.toLowerCase().trim();
      if (minProductPrices[name] === undefined || item.unitPrice < minProductPrices[name]) {
        minProductPrices[name] = item.unitPrice;
      }
    });

    let totalPotentialSavings = 0;
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const name = item.productName.toLowerCase().trim();
        const minPrice = minProductPrices[name];
        if (minPrice !== undefined && item.unitPrice > minPrice) {
          // Saving difference per unit * quantity
          const actualPaid = item.netPrice;
          const idealPaid = (minPrice * item.quantity) * (1 + (item.taxRate / 100)) - item.discount;
          const saving = actualPaid - idealPaid;
          if (saving > 0) {
            totalPotentialSavings += saving;
          }
        }
      });
    });

    return {
      kpis: {
        totalSpentThisMonth: parseFloat(totalSpentThisMonth.toFixed(2)),
        totalSpentThisYear: parseFloat(totalSpentThisYear.toFixed(2)),
        totalSpentAllTime: parseFloat(totalSpentAllTime.toFixed(2)),
        invoiceCount: totalInvoicesCount,
        monthlyInvoiceCount: monthlyInvoicesCount,
        totalItemsCount,
        savingsIndex: parseFloat(totalPotentialSavings.toFixed(2)),
      },
      categoryBreakdown,
      storeBreakdown,
      recentInvoices: allInvoices.slice(0, 5).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        date: inv.date,
        totalAmount: inv.totalAmount,
        storeName: inv.store.name,
      })),
    };
  }

  async comparePrices(userId: string, productName: string) {
    const cleanName = productName.toLowerCase().trim();

    // Fetch all records of this product
    const items = await this.prisma.invoiceItem.findMany({
      where: {
        productName: {
          contains: cleanName,
          mode: 'insensitive',
        },
        invoice: { userId },
      },
      include: {
        invoice: {
          include: { store: true },
        },
      },
      orderBy: { invoice: { date: 'asc' } },
    });

    if (items.length === 0) {
      return {
        productName,
        found: false,
        stats: { min: 0, max: 0, average: 0, spread: 0 },
        storeComparison: [],
        history: [],
      };
    }

    // 1. Group by Store and get latest price
    const storeLatestPrices: Record<string, { storeName: string; price: number; date: Date }> = {};
    const allPrices: number[] = [];

    items.forEach(item => {
      const storeName = item.invoice.store.name;
      const price = item.unitPrice;
      const date = item.invoice.date;
      allPrices.push(price);

      if (!storeLatestPrices[storeName] || date > storeLatestPrices[storeName].date) {
        storeLatestPrices[storeName] = { storeName, price, date };
      }
    });

    // Calculate overall stats
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const average = parseFloat((allPrices.reduce((s, p) => s + p, 0) / allPrices.length).toFixed(2));
    const spread = parseFloat((max - min).toFixed(2));

    const storeComparison = Object.values(storeLatestPrices).map(c => ({
      storeName: c.storeName,
      latestPrice: c.price,
      date: c.date,
    })).sort((a, b) => a.latestPrice - b.latestPrice);

    // Get cheapest store overall
    const cheapestStore = storeComparison[0]?.storeName || 'N/A';

    // 2. History of prices for plotting
    const history = items.map(item => ({
      date: item.invoice.date,
      store: item.invoice.store.name,
      price: item.unitPrice,
    }));

    return {
      productName,
      found: true,
      stats: { min, max, average, spread, cheapestStore },
      storeComparison,
      history,
    };
  }

  async getConsumptionStats(userId: string) {
    const items = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: { userId },
      },
      include: {
        invoice: true,
      },
      orderBy: { invoice: { date: 'asc' } },
    });

    // 1. Monthly quantities consumed for key products (Lait 2L, Essence, Riz 5kg)
    const consumptionByProduct: Record<string, Record<string, number>> = {
      'lait 2l': {},
      'essence ordinaire 1l': {},
      'riz 5kg': {},
    };

    items.forEach(item => {
      const name = item.productName.toLowerCase().trim();
      if (consumptionByProduct[name] !== undefined) {
        const date = item.invoice.date;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        consumptionByProduct[name][monthKey] = (consumptionByProduct[name][monthKey] || 0) + item.quantity;
      }
    });

    // 2. Product frequencies ("Quels produits achetons-nous trop souvent ?")
    const productFrequencies: Record<string, { count: number; lastDate: Date; unit: string }> = {};
    items.forEach(item => {
      const name = item.productName;
      if (!productFrequencies[name]) {
        productFrequencies[name] = { count: 0, lastDate: item.invoice.date, unit: item.unit };
      }
      productFrequencies[name].count += item.quantity;
      if (item.invoice.date > productFrequencies[name].lastDate) {
        productFrequencies[name].lastDate = item.invoice.date;
      }
    });

    const topFrequent = Object.entries(productFrequencies)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 3. Products no longer bought ("Quels produits ne sont plus achetés ?")
    // Criteria: bought in the past, but not in the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const noLongerBought = Object.entries(productFrequencies)
      .map(([name, data]) => ({ name, ...data }))
      .filter(p => p.lastDate < threeMonthsAgo)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      monthlyConsumption: {
        milk: Object.entries(consumptionByProduct['lait 2l']).map(([month, qty]) => ({ month, qty })),
        fuel: Object.entries(consumptionByProduct['essence ordinaire 1l']).map(([month, qty]) => ({ month, qty })),
        rice: Object.entries(consumptionByProduct['riz 5kg']).map(([month, qty]) => ({ month, qty })),
      },
      topFrequent,
      noLongerBought,
    };
  }

  async getAlerts(userId: string) {
    const currentDate = new Date();
    const thisMonth = currentDate.getMonth() + 1;
    const thisYear = currentDate.getFullYear();

    const alerts: any[] = [];

    // 1. Budget Alerts
    // Check if any budget is exceeded or near limit (>85%)
    const budgets = await this.prisma.budget.findMany({
      where: { userId, month: thisMonth, year: thisYear },
      include: { category: true },
    });

    const startDate = new Date(thisYear, thisMonth - 1, 1);
    const endDate = new Date(thisYear, thisMonth, 0, 23, 59, 59);

    for (const b of budgets) {
      let spent = 0;
      if (b.categoryId) {
        const ag = await this.prisma.invoiceItem.aggregate({
          where: {
            categoryId: b.categoryId,
            invoice: {
              userId,
              date: { gte: startDate, lte: endDate },
            },
          },
          _sum: { netPrice: true },
        });
        spent = ag._sum.netPrice || 0;
      } else {
        const ag = await this.prisma.invoice.aggregate({
          where: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { totalAmount: true },
        });
        spent = ag._sum.totalAmount || 0;
      }

      const percentage = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const categoryName = b.category ? b.category.name : 'Global';

      if (spent > b.amount) {
        alerts.push({
          type: 'BUDGET_EXCEEDED',
          severity: 'HIGH',
          title: `Budget ${categoryName} Dépassé`,
          message: `Vous avez dépassé votre budget ${categoryName} de ${parseFloat((percentage - 100).toFixed(1))}%. Dépense: ${spent.toFixed(2)}$ / Limite: ${b.amount.toFixed(2)}$.`,
          data: { budgetId: b.id, categoryName, spent, limit: b.amount, percentage },
        });
      } else if (percentage >= 85) {
        alerts.push({
          type: 'BUDGET_WARNING',
          severity: 'MEDIUM',
          title: `Budget ${categoryName} Presque Atteint`,
          message: `Vous avez utilisé ${parseFloat(percentage.toFixed(1))}% de votre budget ${categoryName}. Dépense: ${spent.toFixed(2)}$ / Limite: ${b.amount.toFixed(2)}$.`,
          data: { budgetId: b.id, categoryName, spent, limit: b.amount, percentage },
        });
      }
    }

    // 2. Price Hike Alerts (>10% inflation compared to historical average)
    const items = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: { userId }
      },
      include: {
        invoice: {
          include: { store: true },
        },
      },
      orderBy: { invoice: { date: 'asc' } },
    });

    const productPrices: Record<string, number[]> = {};
    const productLatestPrice: Record<string, { price: number; date: Date }> = {};

    items.forEach(item => {
      const name = item.productName;
      const price = item.unitPrice;
      const date = item.invoice.date;

      if (!productPrices[name]) {
        productPrices[name] = [];
      }
      productPrices[name].push(price);

      if (!productLatestPrice[name] || date > productLatestPrice[name].date) {
        productLatestPrice[name] = { price, date };
      }
    });

    Object.entries(productLatestPrice).forEach(([name, latest]) => {
      const prices = productPrices[name];
      if (prices.length >= 3) {
        // Compute average price excluding latest price
        const sum = prices.reduce((s, p) => s + p, 0);
        const avg = sum / prices.length;
        const increasePercentage = ((latest.price - avg) / avg) * 100;

        if (increasePercentage >= 10.0) {
          alerts.push({
            type: 'PRICE_HIKE',
            severity: 'MEDIUM',
            title: `Hausse de prix : ${name}`,
            message: `Le prix de "${name}" a augmenté de ${parseFloat(increasePercentage.toFixed(1))}% par rapport à sa moyenne historique. Nouveau prix : ${latest.price.toFixed(2)}$ (Moyenne : ${avg.toFixed(2)}$).`,
            data: { productName: name, latestPrice: latest.price, avgPrice: avg, increasePercentage },
          });
        }
      }
    });

    // 3. Potential Savings Recommendations
    // If they bought a product at a store where it was expensive, but we know it's cheaper at Costco or another store
    const costcoItems = items.filter(i => i.invoice.store.name === 'Costco');
    const otherItems = items.filter(i => i.invoice.store.name !== 'Costco');

    const costcoCheapest: Record<string, number> = {};
    costcoItems.forEach(i => {
      const name = i.productName.toLowerCase().trim();
      if (costcoCheapest[name] === undefined || i.unitPrice < costcoCheapest[name]) {
        costcoCheapest[name] = i.unitPrice;
      }
    });

    const recommendedPromo: Record<string, boolean> = {};
    otherItems.forEach(i => {
      const name = i.productName.toLowerCase().trim();
      const costcoPrice = costcoCheapest[name];
      if (costcoPrice !== undefined && i.unitPrice > costcoPrice && !recommendedPromo[name]) {
        recommendedPromo[name] = true;
        const savingsPct = ((i.unitPrice - costcoPrice) / i.unitPrice) * 100;
        alerts.push({
          type: 'POTENTIAL_PROMO',
          severity: 'LOW',
          title: `Optimisation de magasin : ${i.productName}`,
          message: `Le produit "${i.productName}" est habituellement ${parseFloat(savingsPct.toFixed(1))}% moins cher chez Costco (${costcoPrice.toFixed(2)}$ au lieu de ${i.unitPrice.toFixed(2)}$).`,
          data: { productName: i.productName, usualPrice: i.unitPrice, recommendedPrice: costcoPrice, storeRecommended: 'Costco' },
        });
      }
    });

    return alerts;
  }
}
