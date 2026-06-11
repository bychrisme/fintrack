import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateCSV(type: string, userId: string): Promise<string> {
    const cleanType = type.toLowerCase().trim();

    if (cleanType === 'monthly' || cleanType === 'annual' || cleanType === 'expenses') {
      const invoices = await this.prisma.invoice.findMany({
        where: { userId },
        include: { store: true },
        orderBy: { date: 'desc' },
      });

      let csv = 'Date,Facture,Magasin,Mode de Paiement,Montant Total,Taxes Totales,Commentaires\n';
      invoices.forEach(inv => {
        const dateStr = inv.date.toISOString().split('T')[0];
        const comments = inv.comments ? inv.comments.replace(/"/g, '""') : '';
        csv += `${dateStr},"${inv.invoiceNumber}","${inv.store.name}","${inv.paymentMode}",${inv.totalAmount},${inv.totalTaxes},"${comments}"\n`;
      });
      return csv;
    }

    if (cleanType === 'stores') {
      const stores = await this.prisma.store.findMany({
        where: { userId },
        include: {
          invoices: {
            where: { userId },
            select: { totalAmount: true },
          },
        },
      });

      let csv = 'Magasin,Nombre de Factures,Total Depense,Ticket Moyen,Ville,Province,Type\n';
      stores.forEach(store => {
        const count = store.invoices.length;
        const total = store.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const avg = count > 0 ? total / count : 0;
        csv += `"${store.name}",${count},${total.toFixed(2)},${avg.toFixed(2)},"${store.city}","${store.province}","${store.type}"\n`;
      });
      return csv;
    }

    if (cleanType === 'prices') {
      const items = await this.prisma.invoiceItem.findMany({
        where: {
          invoice: { userId }
        },
        include: {
          invoice: {
            include: { store: true },
          },
        },
      });

      // Group prices by product and store
      const grouping: Record<string, Record<string, { count: number; sum: number; min: number; max: number }>> = {};
      items.forEach(item => {
        const prod = item.productName;
        const store = item.invoice.store.name;
        const price = item.unitPrice;

        if (!grouping[prod]) {
          grouping[prod] = {};
        }
        if (!grouping[prod][store]) {
          grouping[prod][store] = { count: 0, sum: 0, min: price, max: price };
        }

        const data = grouping[prod][store];
        data.count += item.quantity;
        data.sum += price * item.quantity;
        if (price < data.min) data.min = price;
        if (price > data.max) data.max = price;
      });

      let csv = 'Produit,Magasin,Quantite Totale Achetée,Dépense Totale,Prix Moyen,Prix Min Observé,Prix Max Observé\n';
      Object.entries(grouping).forEach(([prod, storesData]) => {
        Object.entries(storesData).forEach(([store, d]) => {
          const avg = d.count > 0 ? d.sum / d.count : 0;
          csv += `"${prod}","${store}",${d.count},${d.sum.toFixed(2)},${avg.toFixed(2)},${d.min.toFixed(2)},${d.max.toFixed(2)}\n`;
        });
      });
      return csv;
    }

    if (cleanType === 'consumption') {
      const items = await this.prisma.invoiceItem.findMany({
        where: {
          invoice: { userId },
        },
        include: {
          category: true,
        },
      });

      const prodMap: Record<string, { category: string; qty: number; totalPaid: number; unit: string }> = {};
      items.forEach(item => {
        const name = item.productName;
        if (!prodMap[name]) {
          prodMap[name] = { category: item.category.name, qty: 0, totalPaid: 0, unit: item.unit };
        }
        prodMap[name].qty += item.quantity;
        prodMap[name].totalPaid += item.netPrice;
      });

      let csv = 'Produit,Catégorie,Quantité Totale,Unité de Mesure,Total Payé,Prix Moyen Net\n';
      Object.entries(prodMap).forEach(([name, data]) => {
        const avg = data.qty > 0 ? data.totalPaid / data.qty : 0;
        csv += `"${name}","${data.category}",${data.qty},"${data.unit}",${data.totalPaid.toFixed(2)},${avg.toFixed(2)}\n`;
      });
      return csv;
    }

    throw new BadRequestException('Type de rapport invalide');
  }
}
