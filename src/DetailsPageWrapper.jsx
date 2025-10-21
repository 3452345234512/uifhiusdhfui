import { useState, useMemo, useEffect } from 'react'
import DetailsPage from './DetailsPage'

function DetailsPageWrapper() {
  // Копируем всю логику из App.jsx для расчетов
  const [companyCostEE, setCompanyCostEE] = useState(5.4)
  const [clientCostEE, setClientCostEE] = useState(6.2)
  const [fleetT21Percent, setFleetT21Percent] = useState(52)
  const [marginPercent, setMarginPercent] = useState(30)
  const [totalPoolTH, setTotalPoolTH] = useState(5430)
  const [btcPriceNow, setBtcPriceNow] = useState(106497)
  const [btcPerTHPerDay, setBtcPerTHPerDay] = useState(0.00000043)

  const usdtRate = 82
  const difficultyGrowth = 47.28

  const miners = {
    'T21_190': {
      name: 'Antminer T21 (190TH)',
      hashrate: 190,
      power: 3610,
      price: 2050,
      efficiency: 19
    },
    'S21Pro': {
      name: 'Antminer S21 Pro',
      hashrate: 245,
      power: 3675,
      price: 3900,
      efficiency: 15
    }
  }

  const fleetS21Percent = 100 - fleetT21Percent

  const poolCalculations = useMemo(() => {
    const t21TH = (totalPoolTH * fleetT21Percent) / 100
    const s21TH = (totalPoolTH * fleetS21Percent) / 100
    
    const t21Count = Math.ceil(t21TH / miners.T21_190.hashrate)
    const s21Count = Math.ceil(s21TH / miners.S21Pro.hashrate)
    
    const t21CostPerTH = miners.T21_190.price / miners.T21_190.hashrate
    const s21CostPerTH = miners.S21Pro.price / miners.S21Pro.hashrate
    const avgCostPerTH = (t21CostPerTH * fleetT21Percent + s21CostPerTH * fleetS21Percent) / 100
    
    const avgEfficiency = (miners.T21_190.efficiency * fleetT21Percent + miners.S21Pro.efficiency * fleetS21Percent) / 100
    
    const totalPowerMW = ((t21Count * miners.T21_190.power) + (s21Count * miners.S21Pro.power)) / 1000000
    
    return {
      t21TH,
      s21TH,
      t21Count,
      s21Count,
      t21CostPerTH,
      s21CostPerTH,
      avgCostPerTH,
      avgEfficiency,
      totalPowerMW
    }
  }, [totalPoolTH, fleetT21Percent, fleetS21Percent])

  const { t21TH, s21TH, t21Count, s21Count, t21CostPerTH, s21CostPerTH, avgCostPerTH, avgEfficiency, totalPowerMW } = poolCalculations

  const avgEnergyPerTH = (avgEfficiency * 1.1 * 24) / 1000
  const tokenPrice = avgCostPerTH * (1 + marginPercent / 100)

  const companyCostPerKwh = (companyCostEE / usdtRate) * avgEnergyPerTH
  const clientCostPerKwh = (clientCostEE / usdtRate) * avgEnergyPerTH * 1.1
  const miningRevenuePerTH = btcPerTHPerDay * btcPriceNow

  const calculateScenario = (scenarioTH) => {
    const totalInvestment = scenarioTH * avgCostPerTH
    const tokenSalesRevenue = scenarioTH * (tokenPrice - avgCostPerTH)
    const energyProfitPerYear = scenarioTH * (clientCostPerKwh - companyCostPerKwh) * 365
    const totalRevenueYear1 = tokenSalesRevenue + energyProfitPerYear
    const companyROI = (totalRevenueYear1 / totalInvestment) * 100
    
    const investorDailyRevenue = miningRevenuePerTH - clientCostPerKwh
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPrice) * 100
    const paybackYears = investorAnnualRevenue > 0 ? tokenPrice / investorAnnualRevenue : 999
    
    return {
      totalTH: scenarioTH,
      tokens: scenarioTH,
      totalInvestment,
      tokenSalesRevenue,
      energyProfitPerYear,
      totalRevenueYear1,
      companyROI,
      investorDailyRevenue,
      investorAnnualRevenue,
      investorROI,
      paybackYears
    }
  }

  const poolCalculation = useMemo(() => {
    return calculateScenario(totalPoolTH)
  }, [totalPoolTH, avgCostPerTH, tokenPrice, avgEnergyPerTH, companyCostPerKwh, clientCostPerKwh, miningRevenuePerTH])

  return (
    <DetailsPage
      totalPoolTH={totalPoolTH}
      t21Count={t21Count}
      s21Count={s21Count}
      t21TH={t21TH}
      s21TH={s21TH}
      avgCostPerTH={avgCostPerTH}
      tokenPrice={tokenPrice}
      marginPercent={marginPercent}
      avgEfficiency={avgEfficiency}
      poolCalculation={poolCalculation}
      clientCostEE={clientCostEE}
      difficultyGrowth={difficultyGrowth}
      btcPriceNow={btcPriceNow}
      miners={miners}
      fleetT21Percent={fleetT21Percent}
      fleetS21Percent={fleetS21Percent}
    />
  )
}

export default DetailsPageWrapper

