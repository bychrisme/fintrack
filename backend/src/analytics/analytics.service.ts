import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const currentDate = new Date();
    const thisMonthStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
    const thisYearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    const startOfToday = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));
    
    // Start of week (Monday)
    const day = currentDate.getUTCDay();
    const diff = currentDate.getUTCDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), diff));

    // 1. Fetch all user invoices
    const allInvoices = await this.prisma.invoice.findMany({
      where: { userId },
      include: {
        store: true,
        items: {
          include: { category: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    // 2. Calculate totals
    const totalSpentAllTime = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalInvoicesCount = allInvoices.length;

    const todayInvoices = allInvoices.filter(inv => inv.date >= startOfToday);
    const totalSpentToday = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const weeklyInvoices = allInvoices.filter(inv => inv.date >= startOfWeek);
    const totalSpentThisWeek = weeklyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

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
        totalSpentToday: parseFloat(totalSpentToday.toFixed(2)),
        totalSpentThisWeek: parseFloat(totalSpentThisWeek.toFixed(2)),
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

    const startDate = new Date(Date.UTC(thisYear, thisMonth - 1, 1));
    const endDate = new Date(Date.UTC(thisYear, thisMonth, 0, 23, 59, 59, 999));

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

  async getKpiDetails(userId: string) {
    const currentDate = new Date();
    const thisMonthStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1));
    const thisYearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    
    // Previous Month start/end
    const lastMonthStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1));
    const lastMonthEnd = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0, 23, 59, 59, 999));

    // Fetch all user invoices
    const allInvoices = await this.prisma.invoice.findMany({
      where: { userId },
      include: {
        store: true,
        items: {
          include: { category: true },
        },
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    const totalSpentAllTime = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalInvoicesCount = allInvoices.length;

    // 1. Dépenses totals
    const monthlyInvoices = allInvoices.filter(inv => inv.date >= thisMonthStart);
    const totalSpentThisMonth = monthlyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const lastMonthInvoices = allInvoices.filter(inv => inv.date >= lastMonthStart && inv.date <= lastMonthEnd);
    const totalSpentLastMonth = lastMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // 2. Évolution des dépenses
    const monthlyVariation = totalSpentLastMonth > 0 
      ? parseFloat((((totalSpentThisMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100).toFixed(1))
      : 0;

    // Tendance sur 3 mois
    const last3Months: any[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - i, 1));
      const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      const mInvoices = allInvoices.filter(inv => inv.date >= mStart && inv.date <= mEnd);
      const amount = mInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const invoiceCount = mInvoices.length;
      last3Months.push({ label, amount: parseFloat(amount.toFixed(2)), invoiceCount });
    }
    last3Months.reverse();

    // Tendance sur 12 mois
    const last12Months: any[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - i, 1));
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
      const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      const mInvoices = allInvoices.filter(inv => inv.date >= mStart && inv.date <= mEnd);
      const amount = mInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const invoiceCount = mInvoices.length;
      last12Months.push({ label, amount: parseFloat(amount.toFixed(2)), invoiceCount });
    }
    last12Months.reverse();

    // Mois le plus dépensier
    const monthlyTotals: Record<string, number> = {};
    allInvoices.forEach(inv => {
      const key = inv.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      monthlyTotals[key] = (monthlyTotals[key] || 0) + inv.totalAmount;
    });
    let maxMonth = 'N/A';
    let maxMonthAmount = 0;
    Object.entries(monthlyTotals).forEach(([month, amount]) => {
      if (amount > maxMonthAmount) {
        maxMonthAmount = amount;
        maxMonth = month;
      }
    });

    const evolutionStats = {
      thisMonthSpent: parseFloat(totalSpentThisMonth.toFixed(2)),
      lastMonthSpent: parseFloat(totalSpentLastMonth.toFixed(2)),
      variation: monthlyVariation,
      trend3Months: last3Months,
      trend12Months: last12Months,
      mostExpensiveMonth: {
        month: maxMonth,
        amount: parseFloat(maxMonthAmount.toFixed(2)),
      },
    };

    // 3. Dépenses par catégorie
    const categoryTotals: Record<string, { name: string; amount: number }> = {};
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const catName = item.category.name;
        if (!categoryTotals[catName]) {
          categoryTotals[catName] = { name: catName, amount: 0 };
        }
        categoryTotals[catName].amount += item.netPrice;
      });
    });
    const totalCategoriesSpent = Object.values(categoryTotals).reduce((sum, c) => sum + c.amount, 0);
    const categoryBreakdown = Object.values(categoryTotals).map(c => ({
      categoryName: c.name,
      amount: parseFloat(c.amount.toFixed(2)),
      percentage: totalCategoriesSpent > 0 ? parseFloat(((c.amount / totalCategoriesSpent) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.amount - a.amount);
    
    const mostExpensiveCategory = categoryBreakdown[0]?.categoryName || 'N/A';

    const categoryStats = {
      breakdown: categoryBreakdown,
      mostExpensive: mostExpensiveCategory,
      totalSpent: parseFloat(totalCategoriesSpent.toFixed(2)),
    };

    // 4. Analyse des magasins
    const storeStats: Record<string, { name: string; totalSpent: number; visitCount: number }> = {};
    allInvoices.forEach(inv => {
      const storeName = inv.store.name;
      if (!storeStats[storeName]) {
        storeStats[storeName] = { name: storeName, totalSpent: 0, visitCount: 0 };
      }
      storeStats[storeName].totalSpent += inv.totalAmount;
      storeStats[storeName].visitCount += 1;
    });

    const storeStatsList = Object.values(storeStats).map(s => ({
      storeName: s.name,
      totalSpent: parseFloat(s.totalSpent.toFixed(2)),
      visitCount: s.visitCount,
      averageTicket: parseFloat((s.totalSpent / s.visitCount).toFixed(2))
    })).sort((a, b) => b.totalSpent - a.totalSpent);

    let mostVisitedStore = 'N/A';
    let maxVisits = 0;
    let mostExpensiveStore = 'N/A';
    let maxAvgTicket = 0;
    let cheapestStoreByAvg = 'N/A';
    let minAvgTicket = Infinity;

    storeStatsList.forEach(s => {
      if (s.visitCount > maxVisits) {
        maxVisits = s.visitCount;
        mostVisitedStore = s.storeName;
      }
      if (s.averageTicket > maxAvgTicket) {
        maxAvgTicket = s.averageTicket;
        mostExpensiveStore = s.storeName;
      }
      if (s.averageTicket < minAvgTicket) {
        minAvgTicket = s.averageTicket;
        cheapestStoreByAvg = s.storeName;
      }
    });
    if (minAvgTicket === Infinity) cheapestStoreByAvg = 'N/A';

    const storeAnalysis = {
      stores: storeStatsList,
      mostVisited: mostVisitedStore,
      mostExpensive: mostExpensiveStore,
      cheapest: cheapestStoreByAvg,
    };

    // 5. Analyse des factures
    let largestInvoiceAmount = 0;
    let smallestInvoiceAmount = totalInvoicesCount > 0 ? Infinity : 0;
    allInvoices.forEach(inv => {
      if (inv.totalAmount > largestInvoiceAmount) largestInvoiceAmount = inv.totalAmount;
      if (inv.totalAmount < smallestInvoiceAmount) smallestInvoiceAmount = inv.totalAmount;
    });
    if (smallestInvoiceAmount === Infinity) smallestInvoiceAmount = 0;

    const invoiceAnalysis = {
      totalCount: totalInvoicesCount,
      averageAmount: totalInvoicesCount > 0 ? parseFloat((totalSpentAllTime / totalInvoicesCount).toFixed(2)) : 0,
      largest: parseFloat(largestInvoiceAmount.toFixed(2)),
      smallest: parseFloat(smallestInvoiceAmount.toFixed(2)),
      monthlyCountTrend: last12Months.map(m => ({ label: m.label, count: m.invoiceCount })),
    };

    // 6. Analyse des produits & 7. Évolution des prix (Inflation)
    const productStatsMap: Record<string, { name: string; totalQty: number; totalPrice: number; prices: number[] }> = {};
    allInvoices.forEach(inv => {
      inv.items.forEach(item => {
        const cleanName = item.productName.trim();
        const price = item.unitPrice;
        const qty = item.quantity;
        if (!productStatsMap[cleanName]) {
          productStatsMap[cleanName] = {
            name: cleanName,
            totalQty: 0,
            totalPrice: 0,
            prices: []
          };
        }
        productStatsMap[cleanName].totalQty += qty;
        productStatsMap[cleanName].totalPrice += price * qty;
        productStatsMap[cleanName].prices.push(price);
      });
    });

    // We also need chronological prices to find first and latest
    const allItemsForEvol = await this.prisma.invoiceItem.findMany({
      where: { invoice: { userId } },
      include: { invoice: true },
      orderBy: { invoice: { date: 'asc' } }
    });

    const productPriceChronology: Record<string, { price: number; date: Date }[]> = {};
    allItemsForEvol.forEach(item => {
      const name = item.productName.trim();
      if (!productPriceChronology[name]) productPriceChronology[name] = [];
      productPriceChronology[name].push({ price: item.unitPrice, date: item.invoice.date });
    });

    const priceEvolutionsList = Object.entries(productPriceChronology)
      .map(([name, history]) => {
        if (history.length < 2) return null;
        const first = history[0].price;
        const last = history[history.length - 1].price;
        const change = last - first;
        const percentageChange = first > 0 ? parseFloat(((change / first) * 100).toFixed(1)) : 0;
        return {
          productName: name,
          firstPrice: first,
          latestPrice: last,
          change,
          percentageChange
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    const priceIncreases = [...priceEvolutionsList]
      .filter(x => x.percentageChange > 0)
      .sort((a, b) => b.percentageChange - a.percentageChange)
      .slice(0, 5);

    const priceDecreases = [...priceEvolutionsList]
      .filter(x => x.percentageChange < 0)
      .sort((a, b) => a.percentageChange - b.percentageChange)
      .slice(0, 5);

    const totalInflationSum = priceEvolutionsList.reduce((sum, x) => sum + x.percentageChange, 0);
    const basketInflation = priceEvolutionsList.length > 0 ? parseFloat((totalInflationSum / priceEvolutionsList.length).toFixed(2)) : 0;

    const productsStatsList = Object.values(productStatsMap).map(p => {
      const minPrice = Math.min(...p.prices);
      const maxPrice = Math.max(...p.prices);
      const avgPrice = parseFloat((p.totalPrice / p.totalQty).toFixed(2));
      const chronology = productPriceChronology[p.name] || [];
      const latestPrice = chronology.length > 0 ? chronology[chronology.length - 1].price : 0;
      return {
        productName: p.name,
        totalQty: parseFloat(p.totalQty.toFixed(2)),
        avgPrice,
        latestPrice,
        minPrice,
        maxPrice
      };
    }).sort((a, b) => b.totalQty - a.totalQty);

    const productAnalysis = {
      topProducts: productsStatsList.slice(0, 10),
      priceEvolution: {
        increases: priceIncreases,
        decreases: priceDecreases,
        basketInflation,
      },
    };

    // 8. TVA et taxes
    const totalTaxesPaid = allInvoices.reduce((sum, inv) => sum + inv.totalTaxes, 0);
    
    const taxesByCategoryMap: Record<string, number> = {};
    const taxesByStoreMap: Record<string, number> = {};
    
    allInvoices.forEach(inv => {
      const storeName = inv.store.name;
      taxesByStoreMap[storeName] = (taxesByStoreMap[storeName] || 0) + inv.totalTaxes;
      
      inv.items.forEach(item => {
        const catName = item.category.name;
        const taxAmount = item.discount > 0 
          ? (item.unitPrice * item.quantity - item.discount) * (item.taxRate / 100)
          : (item.unitPrice * item.quantity) * (item.taxRate / 100);
        taxesByCategoryMap[catName] = (taxesByCategoryMap[catName] || 0) + taxAmount;
      });
    });

    const taxesByCategory = Object.entries(taxesByCategoryMap).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    const taxesByStore = Object.entries(taxesByStoreMap).map(([storeName, amount]) => ({
      storeName,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    const taxAnalysis = {
      totalTaxesPaid: parseFloat(totalTaxesPaid.toFixed(2)),
      taxPercentage: totalSpentAllTime > 0 ? parseFloat(((totalTaxesPaid / totalSpentAllTime) * 100).toFixed(2)) : 0,
      byCategory: taxesByCategory,
      byStore: taxesByStore,
    };

    return {
      evolutionStats,
      categoryStats,
      storeAnalysis,
      invoiceAnalysis,
      productAnalysis,
      taxAnalysis,
    };
  }

  async getProductHistory(userId: string, productName: string) {
    if (!productName) {
      return [];
    }

    const cleanName = productName.toLowerCase().trim();

    // Fetch the last 20 records of this product
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
      orderBy: { invoice: { date: 'desc' } },
      take: 20,
    });

    // Reorder them chronologically (oldest to newest) for the chart
    items.reverse();

    return items.map(item => ({
      id: item.id,
      date: item.invoice.date,
      storeName: item.invoice.store.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      netPrice: item.netPrice,
      unit: item.unit,
    }));
  }
}
