import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { NegocioFechado, ProductType } from '../types';

export interface ProductPacingStats {
  category: ProductType;
  averageCycleDays: number;
  totalVolume: number;
  totalRevenue: number;
  dealCount: number;
}

export interface SdrRoiStats {
  sdrId: string;
  sdrName: string;
  totalRevenue: number;
  totalVolume: number;
  closedCount: number;
  averageCycleDays: number;
}

export interface CohortCell {
  creationMonth: string;
  closingMonth: string;
  volume: number;
  revenue: number;
  count: number;
}

export interface CohortMatrixData {
  creationMonths: string[];
  closingMonths: string[];
  cells: Record<string, Record<string, CohortCell>>;
}

export function useProductPacing() {
  const negociosRaw = useAppStore((state) => state.negocios);

  // Safely default to an empty array to align with strict security and runtime resilience
  const negocios = useMemo(() => {
    return Array.isArray(negociosRaw) ? negociosRaw : [];
  }, [negociosRaw]);

  // Calculations for Product Mix and Sales Cycle
  const productStats = useMemo(() => {
    const statsMap: Record<ProductType, { totalDays: number; count: number; totalVolume: number; totalRevenue: number }> = {} as any;

    const categories: ProductType[] = [
      'INVESTIMENTOS_XP',
      'OPERACAO_COMPROMISSADA',
      'CAMBIO',
      'PREVIDENCIA',
      'SEGURO_VIDA',
      'SEGURO_EM_VIDA',
      'RESPONSABILIDADE_CIVIL',
      'CONSORCIO_IMOBILIARIO',
      'CONSORCIO_AUTOMOTIVO',
      'SUCESSAO_PATRIMONIAL',
      'CONTABILIDADE'
    ];

    // Initialize map
    categories.forEach((cat) => {
      statsMap[cat] = {
        totalDays: 0,
        count: 0,
        totalVolume: 0,
        totalRevenue: 0,
      };
    });

    // Accumulate won deals
    negocios.forEach((n) => {
      if (n.status === 'GANHO') {
        const hasProducts = n.produtos && n.produtos.length > 0;
        
        let diffDays = 0;
        if (n.dataCriacaoLead && n.dataFechamento) {
          const createDate = new Date(n.dataCriacaoLead);
          const closeDate = new Date(n.dataFechamento);
          const diffTime = Math.abs(closeDate.getTime() - createDate.getTime());
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        }

        if (hasProducts) {
          const prodCount = n.produtos!.length;
          n.produtos!.forEach((p) => {
            if (statsMap[p.produtoCategoria]) {
              const entry = statsMap[p.produtoCategoria];
              entry.totalVolume += (n.volumeFinanceiro || 0) / prodCount;
              entry.totalRevenue += p.receitaEstimada || 0;
              entry.count += 1;
              if (diffDays > 0) {
                entry.totalDays += diffDays;
              }
            }
          });
        } else {
          if (statsMap[n.produtoCategoria]) {
            const entry = statsMap[n.produtoCategoria];
            entry.totalVolume += n.volumeFinanceiro || 0;
            entry.totalRevenue += n.receitaEstimada || 0;
            entry.count += 1;
            if (diffDays > 0) {
              entry.totalDays += diffDays;
            }
          }
        }
      }
    });

    // Format output
    return categories.map((cat) => {
      const item = statsMap[cat];
      return {
        category: cat,
        averageCycleDays: item.count > 0 ? Math.round(item.totalDays / item.count) : 0,
        totalVolume: item.totalVolume,
        totalRevenue: item.totalRevenue,
        dealCount: item.count,
      } as ProductPacingStats;
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [negocios]);

  // SDR ROI / Efficiency ranking
  const sdrRoiRanking = useMemo(() => {
    const sdrMap: Record<string, { sdrName: string; totalRevenue: number; totalVolume: number; closedCount: number; totalDays: number }> = {};

    negocios.forEach((n) => {
      if (n.status === 'GANHO') {
        const sdrKey = n.sdrId || 'unassigned';
        const sdrName = n.sdrName || 'Sem SDR / Direto';

        if (!sdrMap[sdrKey]) {
          sdrMap[sdrKey] = {
            sdrName,
            totalRevenue: 0,
            totalVolume: 0,
            closedCount: 0,
            totalDays: 0,
          };
        }

        const entry = sdrMap[sdrKey];
        entry.totalRevenue += n.receitaEstimada || 0;
        entry.totalVolume += n.volumeFinanceiro || 0;
        entry.closedCount += 1;

        if (n.dataCriacaoLead && n.dataFechamento) {
          const createDate = new Date(n.dataCriacaoLead);
          const closeDate = new Date(n.dataFechamento);
          const diffTime = Math.abs(closeDate.getTime() - createDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
          entry.totalDays += diffDays;
        }
      }
    });

    return Object.keys(sdrMap).map((key) => {
      const item = sdrMap[key];
      return {
        sdrId: key,
        sdrName: item.sdrName,
        totalRevenue: item.totalRevenue,
        totalVolume: item.totalVolume,
        closedCount: item.closedCount,
        averageCycleDays: item.closedCount > 0 ? Math.round(item.totalDays / item.closedCount) : 0,
      } as SdrRoiStats;
    }).sort((a, b) => b.totalRevenue - a.totalRevenue); // Sorted by revenue (efficiency / ROI)
  }, [negocios]);

  // Cohort Matrix Calculation (Lead Creation Month vs Closing Month)
  const cohortMatrix = useMemo(() => {
    const cells: Record<string, Record<string, CohortCell>> = {};
    const creationMonthsSet = new Set<string>();
    const closingMonthsSet = new Set<string>();

    negocios.forEach((n) => {
      if (n.status === 'GANHO' && n.dataCriacaoLead && n.dataFechamento) {
        const creationM = n.dataCriacaoLead.substring(0, 7); // e.g. "2026-03"
        const closingM = n.dataFechamento.substring(0, 7);   // e.g. "2026-05"

        creationMonthsSet.add(creationM);
        closingMonthsSet.add(closingM);

        if (!cells[creationM]) {
          cells[creationM] = {};
        }

        if (!cells[creationM][closingM]) {
          cells[creationM][closingM] = {
            creationMonth: creationM,
            closingMonth: closingM,
            volume: 0,
            revenue: 0,
            count: 0
          };
        }

        const cell = cells[creationM][closingM];
        cell.volume += n.volumeFinanceiro || 0;
        cell.revenue += n.receitaEstimada || 0;
        cell.count += 1;
      }
    });

    // Convert sets to sorted arrays
    const creationMonths = Array.from(creationMonthsSet).sort();
    const closingMonths = Array.from(closingMonthsSet).sort();

    return {
      creationMonths,
      closingMonths,
      cells,
    } as CohortMatrixData;
  }, [negocios]);

  // High-level summary card numbers
  const summary = useMemo(() => {
    const wonCount = negocios.filter(n => n.status === 'GANHO').length;
    const totalVolume = negocios.filter(n => n.status === 'GANHO').reduce((sum, n) => sum + (n.volumeFinanceiro || 0), 0);
    const totalRevenue = negocios.filter(n => n.status === 'GANHO').reduce((sum, n) => sum + (n.receitaEstimada || 0), 0);
    
    // Average cycle across all closed deals
    let totalClosedDays = 0;
    let closedWithDatesCount = 0;
    negocios.forEach(n => {
      if (n.status === 'GANHO' && n.dataCriacaoLead && n.dataFechamento) {
        const createDate = new Date(n.dataCriacaoLead);
        const closeDate = new Date(n.dataFechamento);
        const diffTime = Math.abs(closeDate.getTime() - createDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        totalClosedDays += diffDays;
        closedWithDatesCount += 1;
      }
    });
    const avgSalesCycleGlobal = closedWithDatesCount > 0 ? Math.round(totalClosedDays / closedWithDatesCount) : 0;

    return {
      wonCount,
      totalVolume,
      totalRevenue,
      avgSalesCycleGlobal,
    };
  }, [negocios]);

  return {
    productStats,
    sdrRoiRanking,
    cohortMatrix,
    summary,
    negocios, // raw businesses for detailed logging or tabular view
  };
}
