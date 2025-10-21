import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'
import * as XLSX from 'xlsx'
import historicalData from './difficulty.json'
import './App.css'

function App() {
  // КЛЮЧЕВЫЕ ВВОДНЫЕ ПАРАМЕТРЫ
  
  // 1. Электроэнергия
  const [companyCostEE, setCompanyCostEE] = useState(5.4) // Себестоимость ЭЭ (₽/кВт⋅ч)
  const [clientCostEE, setClientCostEE] = useState(6.2) // Продажа ЭЭ клиенту (₽/кВт⋅ч)
  
  // 2. Состав парка оборудования (портфель компании)
  const [fleetT21Percent, setFleetT21Percent] = useState(52) // % T21 190TH в парке
  const [marginPercent, setMarginPercent] = useState(30) // Наценка компании на токены (%)
  const [totalPoolTH, setTotalPoolTH] = useState(5430) // Общая мощность пула в TH
  
  // 3. Токены (наценка настраивается ползунком выше)
  
  // 4. Курс Bitcoin (из ViaBTC API)
  const [btcPriceNow, setBtcPriceNow] = useState(106497) // Курс BTC сейчас ($)
  const [btcPriceYear1, setBtcPriceYear1] = useState(150000) // Курс BTC через 1 год ($)
  const [btcPriceYear2, setBtcPriceYear2] = useState(200000) // Курс BTC через 2 года ($)
  
  // 5. Данные сети (из ViaBTC API)
  const [networkDifficulty, setNetworkDifficulty] = useState(146.72) // Сложность сети (T)
  const [btcPerTHPerDay, setBtcPerTHPerDay] = useState(0.00000043) // Доход BTC/TH/день
  
  // Вспомогательные константы
  const usdtRate = 82 // Курс USDT к рублю
  const difficultyGrowth = 47.28 // Рост сложности в год (%)
  
  // Параметры оборудования
  const miners = {
    'T21_190': {
      name: 'Antminer T21 (190TH)',
      hashrate: 190, // TH
      power: 3610, // Вт
      price: 2050, // USD
      efficiency: 19 // Вт/TH
    },
    'S21Pro': {
      name: 'Antminer S21 Pro',
      hashrate: 245, // TH
      power: 3675, // Вт
      price: 3900, // USD
      efficiency: 15 // Вт/TH
    }
  }
  
  // РАСЧЁТ СРЕДНЕВЗВЕШЕННЫХ ПОКАЗАТЕЛЕЙ ПУЛА
  const fleetS21Percent = 100 - fleetT21Percent
  
  // Расчеты, зависящие от состава парка
  const poolCalculations = useMemo(() => {
    // Количество TH каждой модели в пуле
    const t21TH = (totalPoolTH * fleetT21Percent) / 100
    const s21TH = (totalPoolTH * fleetS21Percent) / 100
    
    // Количество асиков каждой модели
    const t21Count = Math.ceil(t21TH / miners.T21_190.hashrate)
    const s21Count = Math.ceil(s21TH / miners.S21Pro.hashrate)
    
    // Средневзвешенная себестоимость 1 TH
    const t21CostPerTH = miners.T21_190.price / miners.T21_190.hashrate
    const s21CostPerTH = miners.S21Pro.price / miners.S21Pro.hashrate
    const avgCostPerTH = (t21CostPerTH * fleetT21Percent + s21CostPerTH * fleetS21Percent) / 100
    
    // Средневзвешенная энергоэффективность (Вт/TH)
    const avgEfficiency = (miners.T21_190.efficiency * fleetT21Percent + miners.S21Pro.efficiency * fleetS21Percent) / 100
    
    // Общее потребление пула
    const t21PowerWatts = t21Count * miners.T21_190.power
    const s21PowerWatts = s21Count * miners.S21Pro.power
    const totalPowerWatts = t21PowerWatts + s21PowerWatts
    const totalPowerMW = totalPowerWatts / 1000000
    
    return {
      t21TH,
      s21TH,
      t21Count,
      s21Count,
      t21CostPerTH,
      s21CostPerTH,
      avgCostPerTH,
      avgEfficiency,
      totalPowerMW,
      t21PowerWatts,
      s21PowerWatts,
      totalPowerWatts
    }
  }, [totalPoolTH, fleetT21Percent, fleetS21Percent])

  // Извлекаем значения из useMemo
  const { t21TH, s21TH, t21Count, s21Count, t21CostPerTH, s21CostPerTH, avgCostPerTH, avgEfficiency, totalPowerMW, t21PowerWatts, s21PowerWatts, totalPowerWatts } = poolCalculations
  
  // Средневзвешенное энергопотребление 1 TH за 24 часа (кВт/день)
  const avgEnergyPerTH = (avgEfficiency * 1.1 * 24) / 1000
  
  // Цена токена H2C (единая для всех)
  const tokenPrice = avgCostPerTH * (1 + marginPercent / 100)
  
  // Добыча BTC за день (зависит от общей мощности пула)
  const dailyBTCProduction = useMemo(() => {
    return btcPerTHPerDay * totalPoolTH
  }, [btcPerTHPerDay, totalPoolTH])
  
  // Затраты и доходы
  const companyCostPerKwh = (companyCostEE / usdtRate) * avgEnergyPerTH
  const clientCostPerKwh = (clientCostEE / usdtRate) * avgEnergyPerTH * 1.1 // +10% наценка на ЭЭ
  const miningRevenuePerTH = btcPerTHPerDay * btcPriceNow
  
  // Чистый доход клиента (средний по пулу)
  const avgNetDailyRevenue = miningRevenuePerTH - clientCostPerKwh
  const avgAnnualRevenue = avgNetDailyRevenue * 365
  const avgROI = (avgAnnualRevenue / tokenPrice) * 100
  
  // Сценарии Bitcoin
  const btcScenarios = [
    { label: 'Медвежий', price: 50000 },
    { label: 'Низкий', price: 80000 },
    { label: 'Текущий', price: btcPriceNow },
    { label: 'Умеренный', price: 120000 },
    { label: 'Оптимистичный', price: 150000 },
    { label: 'Бычий', price: 200000 },
  ]
  
  // Удалены сценарии - работаем только с общим пулом

  // Функция расчёта для одного сценария
  const calculateScenario = (scenarioTH) => {
    // 1. Доход от продажи токенов
    const profitPerToken = tokenPrice - avgCostPerTH
    const tokenSalesRevenue = scenarioTH * profitPerToken
    
    // 2. Доход от электроэнергии (за год)
    const companyCostPerDay = companyCostPerKwh
    const clientCostPerDay = clientCostPerKwh
    const energyProfitPerTHPerDay = clientCostPerDay - companyCostPerDay
    const energyProfitPerYear = energyProfitPerTHPerDay * scenarioTH * 365
    
    // 3. Инвестиции компании
    const totalInvestment = scenarioTH * avgCostPerTH
    
    // 4. Итоговый доход за год
    const totalRevenueYear1 = tokenSalesRevenue + energyProfitPerYear
    
    // 5. ROI для компании
    // ROI = (Прибыль от продажи токенов + Прибыль от ЭЭ) / Инвестиции в оборудование
    const companyROI = (totalRevenueYear1 / totalInvestment) * 100
    
    // 6. Доходность для инвестора
    const investorDailyRevenue = miningRevenuePerTH - clientCostPerDay
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPrice) * 100
    const paybackYears = investorAnnualRevenue > 0 ? tokenPrice / investorAnnualRevenue : 999 // Если убыточно, показываем 999 лет
    
    return {
      totalTH: scenarioTH,
      tokens: scenarioTH, // Количество H2C токенов = TH
      totalInvestment,
      tokenSalesRevenue,
      energyProfitPerYear,
      totalRevenueYear1,
      companyROI,
      investorDailyRevenue,
      investorAnnualRevenue,
      investorROI,
      paybackYears,
    }
  }

  // Расчёт для общего пула
  const poolCalculation = useMemo(() => {
    return calculateScenario(totalPoolTH)
  }, [totalPoolTH, avgCostPerTH, tokenPrice, avgEnergyPerTH, companyCostPerKwh, clientCostPerKwh, miningRevenuePerTH])

  // Данные для графика (5 лет) с учётом роста сложности
  const chartData = useMemo(() => {
    const years = 5
    const data = []
    
    for (let year = 0; year <= years; year++) {
      const dataPoint = { year: `Год ${year}` }
      
      if (year === 0) {
        dataPoint.clientRevenue = 0
        dataPoint.companyRevenue = 0
        dataPoint.clientElectricityCost = 0
      } else {
        // Коэффициент снижения доходности из-за роста сложности
        const miningRevenueFactor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
        
        // Доход клиента от майнинга (с учётом падения доходности)
        const adjustedMiningRevenue = poolCalculation.investorAnnualRevenue * miningRevenueFactor
        dataPoint.clientRevenue = adjustedMiningRevenue
        
        // Расходы клиента на ЭЭ (постоянные)
        dataPoint.clientElectricityCost = clientCostPerKwh * totalPoolTH * 365
        
        // Доход компании
        if (year === 1) {
          // Первый год: продажа токенов + ЭЭ
          dataPoint.companyRevenue = poolCalculation.tokenSalesRevenue + poolCalculation.energyProfitPerYear
        } else {
          // Последующие годы: только ЭЭ
          dataPoint.companyRevenue = poolCalculation.energyProfitPerYear
        }
      }
      
      data.push(dataPoint)
    }
    
    return data
  }, [poolCalculation, difficultyGrowth, clientCostPerKwh, totalPoolTH])

  // Функция экспорта в текст (упрощенный вариант вместо PDF)
  const exportToText = () => {
    let text = '═══════════════════════════════════════════\n'
    text += '   КАЛЬКУЛЯТОР ROI МАЙНИНГА - ОТЧЁТ\n'
    text += '═══════════════════════════════════════════\n\n'
    
    text += '📊 ВВОДНЫЕ ПАРАМЕТРЫ:\n\n'
    
    text += '🏢 МАЙНИНГ-ПУЛ:\n'
    text += `• Общая мощность: ${totalPoolTH.toLocaleString()} TH\n`
    text += `• Состав: ${fleetT21Percent}% T21 (${t21TH.toFixed(0)} TH) + ${fleetS21Percent}% S21 Pro (${s21TH.toFixed(0)} TH)\n`
    text += `• Потребление: ${totalPowerMW.toFixed(1)} МВт\n`
    text += `• Средняя эффективность: ${avgEfficiency.toFixed(1)} Вт/TH\n`
    text += `• Энергопотребление 1 TH: ${avgEnergyPerTH.toFixed(3)} кВт/день\n\n`
    
    text += '⚡ ЭЛЕКТРОЭНЕРГИЯ:\n'
    text += `• Себестоимость ЭЭ: ${companyCostEE}₽/кВт⋅ч ($${(companyCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Продажа ЭЭ клиенту: ${clientCostEE}₽/кВт⋅ч ($${(clientCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Маржа: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%\n\n`
    
    text += '💎 ТОКЕНЫ:\n'
    text += `• Себестоимость 1 TH (средняя): $${avgCostPerTH.toFixed(2)}\n`
    text += `• Продажа 1 TH: $${tokenPrice.toFixed(2)}\n`
    text += `• Наценка: ${marginPercent}%\n`
    text += `• Прибыль от продажи: $${(tokenPrice - avgCostPerTH).toFixed(2)}\n\n`
    
    text += '₿ КУРС BITCOIN:\n'
    text += `• Сейчас: $${btcPriceNow.toLocaleString()} (из ViaBTC API)\n`
    text += `• Через 1 год: $${btcPriceYear1.toLocaleString()} (прогноз)\n`
    text += `• Через 2 года: $${btcPriceYear2.toLocaleString()} (прогноз)\n\n`
    
    text += '🌐 ДАННЫЕ СЕТИ (из ViaBTC API):\n'
    text += `• Сложность сети: ${networkDifficulty} триллиона\n`
    text += `• Доход майнинга: ${btcPerTHPerDay.toFixed(8)} BTC/TH/день\n`
    text += `• Доход в USD: $${miningRevenuePerTH.toFixed(5)}/день\n`
    text += `• Рост сложности: ${difficultyGrowth}% в год\n\n`
    
    text += '📋 СПРАВОЧНО:\n'
    text += `• Курс USDT: ${usdtRate}₽\n`
    text += `• Рост сложности: ${difficultyGrowth}% в год\n`
    text += `• +10% на инфраструктуру (сеть, контейнер, вентиляция, аптайм)\n\n`
    
    text += '⚠️ ВАЖНО: Сложность сети растёт ~' + difficultyGrowth + '% в год,\n'
    text += 'что снижает доходность майнинга на тот же процент при неизменной цене BTC\n\n'
    
    // Добавляем сценарии Bitcoin
    text += '═══════════════════════════════════════════\n'
    text += '  СЦЕНАРИИ BITCOIN (при текущей сложности)\n'
    text += '═══════════════════════════════════════════\n\n'
    
    btcScenarios.forEach((scenario) => {
      const miningRev = btcPerTHPerDay * scenario.price
      const clientCost = (clientCostEE / usdtRate) * avgEnergyPerTH
      const netRevenue = miningRev - clientCost
      const annualRevenue = netRevenue * 365
      const roi = (annualRevenue / tokenPrice) * 100
      const payback = tokenPrice / annualRevenue
      
      text += `${scenario.label}: $${scenario.price.toLocaleString()}\n`
      text += `  Доход майнинга: $${miningRev.toFixed(5)}/день\n`
      text += `  Чистый доход: $${netRevenue.toFixed(5)}/день ($${annualRevenue.toFixed(2)}/год)\n`
      text += `  ROI инвестора: ${roi.toFixed(1)}%\n`
      text += `  Окупаемость: ${payback.toFixed(2)} лет\n\n`
    })
    
    text += '═══════════════════════════════════════════\n'
    text += '  ЦЕЛЕВЫЕ ПОКАЗАТЕЛИ\n'
    text += '═══════════════════════════════════════════\n\n'
    
    text += '🎯 ТРЕБОВАНИЯ:\n'
    text += '• ROI клиента: 33% годовых (с учётом роста сложности + роста BTC 10-15%)\n'
    text += '• Наша прибыль от токенов: 30-40%\n'
    text += '• Наша прибыль от ЭЭ: ≥30% (с учётом налогов)\n'
    text += '• Срок жизни оборудования: 3 года\n\n'
    
    text += '💡 ТЕКУЩИЕ ПОКАЗАТЕЛИ:\n'
    text += `• Наценка на токены: ${marginPercent}% ${marginPercent >= 30 && marginPercent <= 40 ? '✅' : '⚠️'}\n`
    text += `• ROI инвестора: ${avgROI.toFixed(1)}%\n`
    text += `• Маржа ЭЭ: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% (не критично)\n\n`
    
    // Показатели пула
    text += `\n${'═'.repeat(43)}\n`
    text += `📦 МАЙНИНГ-ПУЛ HASH2CASH\n`
    text += `${'═'.repeat(43)}\n`
    text += `• Токенов: ${poolCalculation.tokens.toLocaleString()}\n`
    text += `• Мощность: ${poolCalculation.totalTH.toLocaleString()} TH\n`
    text += `• Инвестиции: $${poolCalculation.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n\n`
    text += `💰 ДОХОД КОМПАНИИ (год 1):\n`
    text += `• От продажи токенов: $${poolCalculation.tokenSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
    text += `• От электроэнергии: $${poolCalculation.energyProfitPerYear.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
    text += `• ИТОГО: $${poolCalculation.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
    text += `• ROI компании: ${poolCalculation.companyROI.toFixed(1)}%\n\n`
    text += `📈 ДОХОДНОСТЬ ИНВЕСТОРА (при текущей сложности):\n`
    text += `• Чистый доход: $${poolCalculation.investorDailyRevenue.toFixed(4)}/день\n`
    text += `• Годовой доход: $${poolCalculation.investorAnnualRevenue.toFixed(2)}\n`
    text += `• ROI: ${poolCalculation.investorROI.toFixed(2)}% годовых\n`
    text += `• Окупаемость: ${poolCalculation.paybackYears.toFixed(2)} лет\n\n`
    
    // Добавим прогноз с учётом роста сложности
    text += `📉 ПРОГНОЗ С УЧЁТОМ РОСТА СЛОЖНОСТИ (${difficultyGrowth}%):\n`
    for (let year = 1; year <= 3; year++) {
      const factor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
      const adjustedRevenue = poolCalculation.investorAnnualRevenue * factor
      const adjustedROI = (adjustedRevenue / tokenPrice) * 100
      text += `• Год ${year}: доход $${adjustedRevenue.toFixed(2)} (ROI ${adjustedROI.toFixed(2)}%)\n`
    }
    
    text += `\n${'═'.repeat(43)}\n`
    text += `Дата создания: ${new Date().toLocaleString('ru-RU')}\n`
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `roi_calculator_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Функция экспорта в Excel с формулами
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    
    // === ЛИСТ 1: ВВОДНЫЕ ДАННЫЕ ===
    const inputData = [
      ['КАЛЬКУЛЯТОР ROI МАЙНИНГА'],
      [`Дата создания: ${new Date().toLocaleString('ru-RU')}`],
      [],
      ['ВВОДНЫЕ ПАРАМЕТРЫ'],
      [],
      ['Параметр', 'Значение', 'Единица измерения'],
      ['Курс USDT', usdtRate, '₽'],
      ['Рост сложности сети', difficultyGrowth, '% в год'],
      ['Сложность сети', networkDifficulty, 'Триллионов'],
      ['Доход майнинга', btcPerTHPerDay, 'BTC/TH/день'],
      [],
      ['ЭЛЕКТРОЭНЕРГИЯ'],
      ['Себестоимость ЭЭ', companyCostEE, '₽/кВт⋅ч'],
      ['Продажа ЭЭ клиенту', clientCostEE, '₽/кВт⋅ч'],
      [],
      ['ТОКЕНЫ'],
      ['Продажа 1 TH', tokenPrice, '$'],
      [],
      ['BITCOIN'],
      ['Курс BTC сейчас', btcPriceNow, '$'],
      ['Курс BTC через 1 год', btcPriceYear1, '$'],
      ['Курс BTC через 2 года', btcPriceYear2, '$'],
    ]
    
    const ws1 = XLSX.utils.aoa_to_sheet(inputData)
    ws1['!cols'] = [{ width: 30 }, { width: 15 }, { width: 20 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Вводные данные')
    
    // === ЛИСТ 2: СРАВНЕНИЕ T21 vs S21 Pro ===
    const equipmentData = [
      ['СРАВНЕНИЕ ОБОРУДОВАНИЯ'],
      [],
      ['Параметр', 'T21', 'S21 Pro', 'Разница'],
      ['Модель', miners.T21.name, miners.S21Pro.name, ''],
      ['Хешрейт (TH)', miners.T21.hashrate, miners.S21Pro.hashrate, { f: '=C5-B5' }],
      ['Потребление (Вт)', miners.T21.power, miners.S21Pro.power, { f: '=C6-B6' }],
      ['Цена ($)', miners.T21.price, miners.S21Pro.price, { f: '=C7-B7' }],
      ['Эффективность (Вт/TH)', miners.T21.efficiency, miners.S21Pro.efficiency, { f: '=C8-B8' }],
      [],
      ['РАСЧЁТНЫЕ ПОКАЗАТЕЛИ'],
      ['Себестоимость 1 TH ($)', { f: '=B7/B5' }, { f: '=C7/C5' }, { f: '=C11-B11' }],
      ['Энергопотребление 1 TH (кВт/день)', { f: '=(B6*1.1/B5)*24/1000' }, { f: '=(C6*1.1/C5)*24/1000' }, { f: '=C12-B12' }],
      [],
      ['ДОХОДНОСТЬ (при текущих условиях)'],
      ['Наценка при цене $' + tokenPrice, { f: `=((${tokenPrice}/B11)-1)*100` }, { f: `=((${tokenPrice}/C11)-1)*100` }, { f: '=C15-B15' }],
      ['Доход майнинга ($/день)', { f: `=${btcPerTHPerDay}*${btcPriceNow}` }, { f: `=${btcPerTHPerDay}*${btcPriceNow}` }, '='],
      ['Затраты на ЭЭ ($/день)', { f: `=(${clientCostEE}/${usdtRate})*B12` }, { f: `=(${clientCostEE}/${usdtRate})*C12` }, { f: '=C17-B17' }],
      ['Чистый доход ($/день)', { f: '=B16-B17' }, { f: '=C16-C17' }, { f: '=C18-B18' }],
      ['Годовой доход ($/год)', { f: '=B18*365' }, { f: '=C18*365' }, { f: '=C19-B19' }],
      ['ROI инвестора (%)', { f: `=(B19/${tokenPrice})*100` }, { f: `=(C19/${tokenPrice})*100` }, { f: '=C20-B20' }],
      ['Окупаемость (лет)', { f: `=${tokenPrice}/B19` }, { f: `=${tokenPrice}/C19` }, { f: '=C21-B21' }],
      [],
      ['ДОХОДНОСТЬ КОМПАНИИ'],
      ['Прибыль от продажи 1 TH ($)', { f: `=${tokenPrice}-B11` }, { f: `=${tokenPrice}-C11` }, { f: '=C24-B24' }],
      ['Прибыль от ЭЭ в год ($/TH)', { f: `=((${clientCostEE}-${companyCostEE})/${usdtRate})*B12*365` }, { f: `=((${clientCostEE}-${companyCostEE})/${usdtRate})*C12*365` }, { f: '=C25-B25' }],
      ['Общая прибыль за год 1 ($/TH)', { f: '=B24+B25' }, { f: '=C24+C25' }, { f: '=C26-B26' }],
    ]
    
    const ws2 = XLSX.utils.aoa_to_sheet(equipmentData)
    ws2['!cols'] = [{ width: 35 }, { width: 20 }, { width: 20 }, { width: 20 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'T21 vs S21 Pro')
    
    // === ЛИСТ 3: ПРОГНОЗ НА 3 ГОДА (T21) ===
    const forecast21Data = [
      ['ПРОГНОЗ НА 3 ГОДА - T21'],
      [`Цена токена: $${tokenPrice}`],
      [`Рост сложности: ${difficultyGrowth}% в год`],
      ['Рост BTC: 12.5% в год'],
      [],
      ['Год', 'Курс BTC ($)', 'Коэффициент сложности', 'Доход майнинга ($/день)', 'Затраты ЭЭ ($/день)', 'Чистый доход ($/день)', 'Годовой доход ($)', 'ROI (%)', 'Статус'],
    ]
    
    for (let year = 1; year <= 3; year++) {
      const row = year + 6
      forecast21Data.push([
        year,
        { f: `=B2*POWER(1.125,${year})` }, // Курс BTC
        { f: `=POWER(1-C2/100,${year})` }, // Коэффициент сложности
        { f: `=(C${row}*B${row})*${btcPerTHPerDay}` }, // Доход майнинга
        { f: `=(${clientCostEE}/${usdtRate})*(${miners.T21.power}*1.1/${miners.T21.hashrate})*24/1000` }, // Затраты ЭЭ
        { f: `=D${row}-E${row}` }, // Чистый доход
        { f: `=F${row}*365` }, // Годовой доход
        { f: `=(G${row}/${tokenPrice})*100` }, // ROI
        { f: `=IF(H${row}>=33,"✅ Цель выполнена","⚠️ Ниже цели")` }
      ])
    }
    
    forecast21Data.push([])
    forecast21Data.push(['ИТОГО ЗА 3 ГОДА', '', '', '', '', '', { f: '=SUM(G7:G9)' }, { f: '=AVERAGE(H7:H9)' }, ''])
    forecast21Data.push(['Средний ROI', '', '', '', '', '', '', { f: '=I11' }, ''])
    
    const ws3 = XLSX.utils.aoa_to_sheet(forecast21Data)
    ws3['!cols'] = [{ width: 8 }, { width: 15 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 12 }, { width: 20 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Прогноз T21')
    
    // === ЛИСТ 4: ПРОГНОЗ НА 3 ГОДА (S21 Pro) ===
    const forecastS21Data = [
      ['ПРОГНОЗ НА 3 ГОДА - S21 Pro'],
      [`Цена токена: $${tokenPrice}`],
      [`Рост сложности: ${difficultyGrowth}% в год`],
      ['Рост BTC: 12.5% в год'],
      [],
      ['Год', 'Курс BTC ($)', 'Коэффициент сложности', 'Доход майнинга ($/день)', 'Затраты ЭЭ ($/день)', 'Чистый доход ($/день)', 'Годовой доход ($)', 'ROI (%)', 'Статус'],
    ]
    
    for (let year = 1; year <= 3; year++) {
      const row = year + 6
      forecastS21Data.push([
        year,
        { f: `=B2*POWER(1.125,${year})` },
        { f: `=POWER(1-C2/100,${year})` },
        { f: `=(C${row}*B${row})*${btcPerTHPerDay}` },
        { f: `=(${clientCostEE}/${usdtRate})*(${miners.S21Pro.power}*1.1/${miners.S21Pro.hashrate})*24/1000` },
        { f: `=D${row}-E${row}` },
        { f: `=F${row}*365` },
        { f: `=(G${row}/${tokenPrice})*100` },
        { f: `=IF(H${row}>=33,"✅ Цель выполнена","⚠️ Ниже цели")` }
      ])
    }
    
    forecastS21Data.push([])
    forecastS21Data.push(['ИТОГО ЗА 3 ГОДА', '', '', '', '', '', { f: '=SUM(G7:G9)' }, { f: '=AVERAGE(H7:H9)' }, ''])
    forecastS21Data.push(['Средний ROI', '', '', '', '', '', '', { f: '=I11' }, ''])
    
    const ws4 = XLSX.utils.aoa_to_sheet(forecastS21Data)
    ws4['!cols'] = [{ width: 8 }, { width: 15 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 22 }, { width: 18 }, { width: 12 }, { width: 20 }]
    XLSX.utils.book_append_sheet(wb, ws4, 'Прогноз S21 Pro')
    
    // === ЛИСТ 5: ОПТИМАЛЬНЫЕ ЦЕНЫ ===
    const optimalData = [
      ['ПОДБОР ОПТИМАЛЬНЫХ ЦЕН'],
      [],
      ['ТРЕБОВАНИЯ'],
      ['ROI клиента', '≥33%'],
      ['Наценка компании', '30-40%'],
      [],
      ['', 'T21', 'S21 Pro'],
      ['Себестоимость 1 TH', { f: `=${miners.T21.price}/${miners.T21.hashrate}` }, { f: `=${miners.S21Pro.price}/${miners.S21Pro.hashrate}` }],
      ['Годовой доход при BTC $' + btcPriceNow, { f: `=((${btcPerTHPerDay}*${btcPriceNow})-(${clientCostEE}/${usdtRate})*(${miners.T21.power}*1.1/${miners.T21.hashrate})*24/1000)*365` }, { f: `=((${btcPerTHPerDay}*${btcPriceNow})-(${clientCostEE}/${usdtRate})*(${miners.S21Pro.power}*1.1/${miners.S21Pro.hashrate})*24/1000)*365` }],
      [],
      ['ДЛЯ НАЦЕНКИ 30-40%'],
      ['Мин. цена (30%)', { f: '=B8*1.3' }, { f: '=C8*1.3' }],
      ['Макс. цена (40%)', { f: '=B8*1.4' }, { f: '=C8*1.4' }],
      ['ROI при мин. цене', { f: '=(B9/B12)*100' }, { f: '=(C9/C12)*100' }],
      ['ROI при макс. цене', { f: '=(B9/B13)*100' }, { f: '=(C9/C13)*100' }],
      [],
      ['ДЛЯ ROI 33%'],
      ['Оптимальная цена токена', { f: '=B9/0.33' }, { f: '=C9/0.33' }],
      ['Наценка при этой цене', { f: '=((B18/B8)-1)*100' }, { f: '=((C18/C8)-1)*100' }],
      [],
      ['КОМПРОМИССНЫЙ ВАРИАНТ'],
      ['Рекомендуемая цена', { f: '=AVERAGE(B12,B18)' }, { f: '=AVERAGE(C12,C18)' }],
      ['ROI при этой цене', { f: '=(B9/B22)*100' }, { f: '=(C9/C22)*100' }],
      ['Наценка при этой цене', { f: '=((B22/B8)-1)*100' }, { f: '=((C22/C8)-1)*100' }],
    ]
    
    const ws5 = XLSX.utils.aoa_to_sheet(optimalData)
    ws5['!cols'] = [{ width: 30 }, { width: 20 }, { width: 20 }]
    XLSX.utils.book_append_sheet(wb, ws5, 'Оптимальные цены')
    
    // Сохранение файла
    XLSX.writeFile(wb, `mining_roi_calculator_${Date.now()}.xlsx`)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      {/* Закрепленная панель статистики пула */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Метрики */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Мощность пула</div>
              <div className="text-white font-bold text-lg">{totalPoolTH.toLocaleString()} TH</div>
              <div className="text-white/60 text-xs mt-1">
                = {t21TH.toFixed(0)} TH (T21) + {s21TH.toFixed(0)} TH (S21 Pro)
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Потребление</div>
              <div className="text-white font-bold text-lg">{totalPowerMW.toFixed(1)} МВт</div>
              <div className="text-white/60 text-xs mt-1">
                = {totalPowerWatts.toLocaleString()}W (только асики)
              </div>
              <div className="text-white/50 text-xs mt-1">
                T21: {t21PowerWatts.toLocaleString()}W | S21: {s21PowerWatts.toLocaleString()}W
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Эффективность</div>
              <div className="text-white font-bold text-lg">{avgEfficiency.toFixed(1)} Вт/TH</div>
              <div className="text-white/60 text-xs mt-1">
                = ({miners.T21_190.efficiency} × {fleetT21Percent}% + {miners.S21Pro.efficiency} × {fleetS21Percent}%) ÷ 100
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">₿ Bitcoin</div>
              <div className="text-white font-bold text-lg">${(btcPriceNow/1000).toFixed(0)}k</div>
              <div className="text-white/60 text-xs mt-1">
                = ${btcPriceNow.toLocaleString()} (из ViaBTC API)
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">H2C Цена</div>
              <div className="text-white font-bold text-lg">${tokenPrice.toFixed(2)}</div>
              <div className="text-white/60 text-xs mt-1">
                = ${avgCostPerTH.toFixed(2)} × (1 + {marginPercent}%)
              </div>
            </div>
          </div>
          
          {/* Ползунки настроек */}
          <div className="space-y-3">
            {/* Состав парка */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold text-sm whitespace-nowrap">🖥️ Состав парка:</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={fleetT21Percent}
                    onChange={(e) => setFleetT21Percent(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${fleetT21Percent}%, #10b981 ${fleetT21Percent}%, #10b981 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-white/90 mt-1">
                    <span>{fleetT21Percent}% T21 190TH ({(totalPoolTH * fleetT21Percent / 100).toFixed(0)} TH)</span>
                    <span>{fleetS21Percent}% S21 Pro ({(totalPoolTH * fleetS21Percent / 100).toFixed(0)} TH)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Наценка на токены */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold text-sm whitespace-nowrap">💰 Наценка на токены:</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={marginPercent}
                    onChange={(e) => setMarginPercent(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${marginPercent}%, #e5e7eb ${marginPercent}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="text-xs text-white/90 mt-1">
                    {marginPercent}% наценка = ${(avgCostPerTH * (1 + marginPercent / 100)).toFixed(2)} за токен
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">

        {/* Панель настроек */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Вводные параметры</h2>
          
          {/* 0. СТАТИСТИКА МАЙНИНГ-ПУЛА */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-300">
            <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <span>🏢</span> HASH2CASH Mining Pool
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Общая мощность</div>
                <div className="text-3xl font-bold text-purple-700">{totalPoolTH.toLocaleString()}</div>
                <div className="text-xs text-gray-500">TH/s</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Потребление</div>
                <div className="text-3xl font-bold text-orange-700">{totalPowerMW.toFixed(1)}</div>
                <div className="text-xs text-gray-500">МВт</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Эффективность</div>
                <div className="text-3xl font-bold text-green-700">{avgEfficiency.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Вт/TH (среднее)</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">₿ Добыто сегодня</div>
                <div className="text-2xl font-bold text-blue-700">{dailyBTCProduction.toFixed(6)}</div>
                <div className="text-xs text-gray-500">BTC/день</div>
                <div className="text-xs text-gray-500 mt-1">
                  = {btcPerTHPerDay.toFixed(8)} × {totalPoolTH.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Визуализация состава парка */}
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              <div className="font-bold text-gray-800 mb-3">📊 Состав парка (настраивается в шапке ☝️):</div>
              <div className="flex h-12 rounded-lg overflow-hidden shadow-lg">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 flex flex-col items-center justify-center text-white font-semibold transition-all"
                  style={{width: `${fleetT21Percent}%`}}
                >
                  {fleetT21Percent > 10 && (
                    <>
                      <div className="text-lg">T21 190TH</div>
                      <div className="text-xs">{fleetT21Percent}% ({t21TH.toFixed(0)} TH)</div>
                    </>
                  )}
                </div>
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 flex flex-col items-center justify-center text-white font-semibold transition-all"
                  style={{width: `${fleetS21Percent}%`}}
                >
                  {fleetS21Percent > 10 && (
                    <>
                      <div className="text-lg">S21 Pro</div>
                      <div className="text-xs">{fleetS21Percent}% ({s21TH.toFixed(0)} TH)</div>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-600 text-center">
                💡 Измените состав парка с помощью ползунка в верхней панели
              </div>
            </div>
          </div>
          
          {/* 1. ЭЛЕКТРОЭНЕРГИЯ */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⚡</span> Электроэнергия
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Себестоимость ЭЭ (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={companyCostEE}
                  onChange={(e) => setCompanyCostEE(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(companyCostEE / usdtRate).toFixed(4)}/кВт⋅ч
      </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Продажа ЭЭ клиенту (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={clientCostEE}
                  onChange={(e) => setClientCostEE(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(clientCostEE / usdtRate).toFixed(4)}/кВт⋅ч
                </div>
              </div>
            </div>
          </div>

          {/* 2. ТОКЕН H2C (ЕДИНЫЙ ДЛЯ ВСЕГО ПУЛА) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-purple-500">💎</span> Токен HASH2CASH (H2C)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Средняя себестоимость
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${avgCostPerTH.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Взвешенная по составу парка
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = (${t21CostPerTH.toFixed(2)} × {fleetT21Percent}% + ${s21CostPerTH.toFixed(2)} × {fleetS21Percent}%) ÷ 100
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-300">
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  💰 Цена 1 H2C
                </label>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  ${tokenPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  1 H2C = 1 TH в пуле
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = ${avgCostPerTH.toFixed(2)} × (1 + {marginPercent}%)
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Наценка компании
                </label>
                <div className="text-2xl font-bold text-green-700">
                  {marginPercent}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Прибыль: ${(tokenPrice - avgCostPerTH).toFixed(2)}/TH
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = (${tokenPrice.toFixed(2)} - ${avgCostPerTH.toFixed(2)}) ÷ ${avgCostPerTH.toFixed(2)} × 100%
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <label className="block text-sm font-semibold text-blue-700 mb-2">
                  ROI инвестора
                </label>
                <div className="text-2xl font-bold text-blue-700">
                  {avgROI.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  ${avgAnnualRevenue.toFixed(2)}/год на 1 H2C
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = (${avgAnnualRevenue.toFixed(2)} ÷ ${tokenPrice.toFixed(2)}) × 100%
                </div>
              </div>
            </div>
          </div>

          {/* 3. КУРС BITCOIN */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-orange-500">₿</span> Курс Bitcoin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Сейчас ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceNow}
                  onChange={(e) => setBtcPriceNow(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  📡 Из ViaBTC API
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Через 1 год ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceYear1}
                  onChange={(e) => setBtcPriceYear1(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Прогноз
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Через 2 года ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceYear2}
                  onChange={(e) => setBtcPriceYear2(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Прогноз
                </div>
              </div>
            </div>
          </div>

          {/* 4. ДАННЫЕ СЕТИ */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-blue-500">🌐</span> Данные сети
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Сложность сети (триллионов)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={networkDifficulty}
                  onChange={(e) => setNetworkDifficulty(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  📡 Из ViaBTC API
                </div>
              </div>
      <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Доход (BTC/TH/день)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={btcPerTHPerDay}
                  onChange={(e) => setBtcPerTHPerDay(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${miningRevenuePerTH.toFixed(5)}/день | 📡 Из ViaBTC API
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка экспорта и ключевые показатели */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              💡 <strong>Наценка:</strong> {marginPercent}% 
              {' | '}
              <strong>Прибыль от токена:</strong> ${(tokenPrice - avgCostPerTH).toFixed(2)}
              {' | '}
              <strong>ROI инвестора:</strong> ~{avgROI.toFixed(1)}% годовых
      </div>
          </div>
        </div>

        {/* Блок с формулами расчёта */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📐 Формулы и расчёты ROI</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI для инвестора */}
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-300">
              <h3 className="text-xl font-bold text-blue-900 mb-4">💼 ROI для инвестора</h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">1️⃣ Валовый доход от майнинга (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = BTC/TH/день × Цена BTC
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = {btcPerTHPerDay.toFixed(8)} × ${btcPriceNow.toLocaleString()} = ${miningRevenuePerTH.toFixed(5)}/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">2️⃣ Затраты на электроэнергию (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Тариф клиента (₽/кВт⋅ч) / Курс USDT × Энергопотребление (кВт/день)
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = {clientCostEE}₽ / {usdtRate} × {avgEnergyPerTH.toFixed(3)} кВт = ${clientCostPerKwh.toFixed(5)}/день
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    * Энергопотребление 1 TH (средне) = {avgEnergyPerTH.toFixed(3)} кВт/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">3️⃣ Чистый доход (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Валовый доход - Затраты на ЭЭ
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = ${miningRevenuePerTH.toFixed(5)} - ${clientCostPerKwh.toFixed(5)} = ${(miningRevenuePerTH - clientCostPerKwh).toFixed(5)}/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">4️⃣ Годовой доход:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Чистый доход/день × 365
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = ${(miningRevenuePerTH - clientCostPerKwh).toFixed(5)} × 365 = ${((miningRevenuePerTH - clientCostPerKwh) * 365).toFixed(2)}/год
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                  <div className="font-bold mb-2">5️⃣ ROI инвестора:</div>
                  <div className="font-mono text-xs bg-white/20 p-2 rounded mb-1">
                    = (Годовой доход / Цена токена) × 100%
                  </div>
                  <div className="text-xl font-bold">
                    = (${((miningRevenuePerTH - clientCostPerKwh) * 365).toFixed(2)} / ${tokenPrice}) × 100% = {(((miningRevenuePerTH - clientCostPerKwh) * 365 / tokenPrice) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    Окупаемость: {(tokenPrice / ((miningRevenuePerTH - clientCostPerKwh) * 365)).toFixed(2)} лет
                  </div>
                </div>
              </div>
            </div>

            {/* ROI для компании */}
            <div className="bg-green-50 p-5 rounded-xl border-2 border-green-300">
              <h3 className="text-xl font-bold text-green-900 mb-4">🏢 ROI для компании</h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">1️⃣ Себестоимость 1 TH:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Цена асика / Хешрейт асика
                  </div>
                  <div className="text-green-700 font-semibold">
                    = Средневзвешенная по пулу = ${avgCostPerTH.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">2️⃣ Прибыль от продажи токена (единовременно):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Цена токена - Себестоимость
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${tokenPrice.toFixed(2)} - ${avgCostPerTH.toFixed(2)} = ${(tokenPrice - avgCostPerTH).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Наценка: {marginPercent}%
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">3️⃣ Прибыль от перепродажи ЭЭ (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = (Тариф клиента - Себестоимость ЭЭ) / Курс × Энергопотребление
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ({clientCostEE}₽ - {companyCostEE}₽) / {usdtRate} × {avgEnergyPerTH.toFixed(3)} кВт = ${(clientCostPerKwh - companyCostPerKwh).toFixed(5)}/день
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    За год: ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">4️⃣ Общий доход за первый год (на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Прибыль от токена + Прибыль от ЭЭ за год
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${(tokenPrice - avgCostPerTH).toFixed(2)} + ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} = ${((tokenPrice - avgCostPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg">
                  <div className="font-bold mb-2">5️⃣ ROI компании (первый год):</div>
                  <div className="font-mono text-xs bg-white/20 p-2 rounded mb-1">
                    = (Общий доход / Себестоимость) × 100%
                  </div>
                  <div className="text-xl font-bold">
                    = (${((tokenPrice - avgCostPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} / ${avgCostPerTH.toFixed(2)}) × 100% = {((((tokenPrice - avgCostPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365) / avgCostPerTH) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    Маржа от ЭЭ: {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Детальный расчет потребления */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
            <h4 className="font-bold text-blue-900 mb-3">⚡ Детальный расчет потребления пула:</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-gray-800 mb-2">Потребление асиков:</div>
                <div className="ml-4 space-y-1">
                  <div>• T21 190TH: {t21Count} шт × {miners.T21_190.power}W = <strong>{t21PowerWatts.toLocaleString()}W</strong></div>
                  <div>• S21 Pro: {s21Count} шт × {miners.S21Pro.power}W = <strong>{s21PowerWatts.toLocaleString()}W</strong></div>
                  <div className="border-t pt-1 font-semibold text-lg">ИТОГО: <strong>{totalPowerWatts.toLocaleString()}W</strong> = <strong>{totalPowerMW.toFixed(1)} МВт</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Критический анализ сложности сети */}
          <div className="mt-6 p-4 bg-red-50 rounded-lg border-2 border-red-300">
            <h4 className="font-bold text-red-900 mb-3">🚨 КРИТИЧЕСКИ ВАЖНО: Рост сложности сети Bitcoin</h4>
            <div className="text-sm text-gray-700 space-y-3">
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-red-800 mb-2">📈 Сложность сети растет пиздец как быстро:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Текущий рост:</strong> {difficultyGrowth}% в год</div>
                  <div>• <strong>Это означает:</strong> каждый год доходность майнинга падает на {difficultyGrowth}%</div>
                  <div>• <strong>Через 3 года:</strong> доходность упадет в {(1 - difficultyGrowth/100) ** 3 * 100}% раз</div>
                  <div>• <strong>Через 5 лет:</strong> доходность упадет в {(1 - difficultyGrowth/100) ** 5 * 100}% раз</div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-red-800 mb-2">💰 Что это означает для доходности:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Год 1:</strong> 100% от текущей доходности</div>
                  <div>• <strong>Год 2:</strong> {((1 - difficultyGrowth/100) * 100).toFixed(1)}% от текущей доходности</div>
                  <div>• <strong>Год 3:</strong> {(((1 - difficultyGrowth/100) ** 2) * 100).toFixed(1)}% от текущей доходности</div>
                  <div>• <strong>Год 5:</strong> {(((1 - difficultyGrowth/100) ** 4) * 100).toFixed(1)}% от текущей доходности</div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-red-800 mb-2">🎯 Необходимая динамика курса BTC для сохранения доходности:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Год 1:</strong> BTC должен вырасти на {difficultyGrowth}% (до ${(btcPriceNow * (1 + difficultyGrowth/100)).toLocaleString()})</div>
                  <div>• <strong>Год 2:</strong> BTC должен вырасти на {difficultyGrowth}% (до ${(btcPriceNow * ((1 + difficultyGrowth/100) ** 2)).toLocaleString()})</div>
                  <div>• <strong>Год 3:</strong> BTC должен вырасти на {difficultyGrowth}% (до ${(btcPriceNow * ((1 + difficultyGrowth/100) ** 3)).toLocaleString()})</div>
                  <div>• <strong>Год 5:</strong> BTC должен вырасти на {difficultyGrowth}% (до ${(btcPriceNow * ((1 + difficultyGrowth/100) ** 5)).toLocaleString()})</div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold text-red-800 mb-2">⚠️ Выводы:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Без роста курса BTC:</strong> майнинг станет убыточным через 2-3 года</div>
                  <div>• <strong>Для окупаемости:</strong> BTC должен расти минимум на {difficultyGrowth}% в год</div>
                  <div>• <strong>Риск:</strong> если курс BTC не растет, инвестор теряет деньги</div>
                  <div>• <strong>Рекомендация:</strong> инвестировать только при уверенности в росте BTC</div>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        {/* Таблица сценариев Bitcoin */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">₿ Сравнение сценариев Bitcoin</h2>
          <p className="text-gray-600 mb-4">
            Как изменяется доходность инвестора при разных ценах BTC (при текущей сложности сети)
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Сценарий BTC</th>
                  <th className="px-4 py-3 text-center">Цена BTC</th>
                  <th className="px-4 py-3 text-center">Доход майнинга ($/день)</th>
                  <th className="px-4 py-3 text-center">Чистый доход инвестора</th>
                  <th className="px-4 py-3 text-center">ROI инвестора</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Окупаемость</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {btcScenarios.map((scenario, idx) => {
                  const miningRev = btcPerTHPerDay * scenario.price
                  const clientCost = (clientCostEE / usdtRate) * avgEnergyPerTH // Затраты на ЭЭ за день на 1 TH
                  const netRevenue = miningRev - clientCost
                  const annualRevenue = netRevenue * 365
                  const roi = (annualRevenue / tokenPrice) * 100
                  const payback = tokenPrice / annualRevenue
                  
                  const rowColor = 
                    roi >= 30 ? 'bg-green-50' :
                    roi >= 20 ? 'bg-yellow-50' :
                    roi >= 10 ? 'bg-orange-50' : 'bg-red-50'
                  
                  return (
                    <tr key={idx} className={`hover:bg-opacity-70 ${rowColor}`}>
                      <td className="px-4 py-3 font-semibold">{scenario.label}</td>
                      <td className="px-4 py-3 text-center font-bold">${scenario.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">${miningRev.toFixed(5)}</td>
                      <td className="px-4 py-3 text-center">
                        ${netRevenue.toFixed(5)}/день<br/>
                        <span className="text-xs text-gray-600">${annualRevenue.toFixed(2)}/год</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-lg ${
                          roi >= 30 ? 'text-green-700' :
                          roi >= 20 ? 'text-yellow-700' :
                          roi >= 10 ? 'text-orange-700' : 'text-red-700'
                        }`}>
                          {roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {payback.toFixed(2)} лет
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
      </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Справка:</strong> Цвета показывают уровень ROI - 
              <span className="text-green-700 font-semibold"> зелёный (≥30%)</span>,
              <span className="text-yellow-700 font-semibold"> жёлтый (20-30%)</span>,
              <span className="text-orange-700 font-semibold"> оранжевый (10-20%)</span>,
              <span className="text-red-700 font-semibold"> красный {'(<'}10%)</span>
        </p>
      </div>
        </div>

        {/* Калькулятор подбора оптимальной цены */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            🎯 Калькулятор оптимальной цены токена
          </h2>
          <p className="text-gray-700 mb-6">
            Подберите цену токена для выполнения всех требований к доходности
          </p>

          {(() => {
            // Предварительные расчёты для отображения
            const currentAnnualRevenue = (miningRevenuePerTH - clientCostPerKwh) * 365
            const eeMargin = ((clientCostEE - companyCostEE) / companyCostEE * 100)
            
            return (
              <>
                {/* Блок целевых требований */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-400 shadow-lg">
                    <div className="text-sm text-blue-600 font-semibold mb-2">🎯 ТРЕБОВАНИЕ 1 (критично):</div>
                    <div className="text-xl font-bold text-blue-900 mb-1">ROI клиента ≥33%</div>
                    <div className="text-xs text-gray-600 mb-2">
                      С учётом роста сложности {difficultyGrowth}% + рост BTC 10-15% в год
                    </div>
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      ⏱️ Срок жизни оборудования: 3 года
                    </div>
                    <div className="mt-2 text-sm">
                      Текущий ROI: <span className={`font-bold ${(currentAnnualRevenue / tokenPrice * 100) >= 33 ? 'text-green-600' : 'text-red-600'}`}>
                        {(currentAnnualRevenue / tokenPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-green-400 shadow-lg">
                    <div className="text-sm text-green-600 font-semibold mb-2">🎯 ТРЕБОВАНИЕ 2 (критично):</div>
                    <div className="text-xl font-bold text-green-900 mb-1">Наша наценка 30-40%</div>
                    <div className="text-xs text-gray-600 mb-2">
                      От продажи токенов (монет)
                    </div>
                    <div className="text-xs bg-green-50 p-2 rounded">
                      💰 Основной источник дохода компании
                    </div>
                    <div className="mt-2 text-sm">
                      Текущая наценка: <span className={`font-bold ${marginPercent >= 30 && marginPercent <= 40 ? 'text-green-600' : 'text-red-600'}`}>
                        {marginPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Дополнительная информация о марже ЭЭ */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                      <div className="font-bold text-gray-800 mb-1">О марже ЭЭ:</div>
                      <div className="text-sm text-gray-700">
                        Текущая маржа {eeMargin.toFixed(1)}% ({companyCostEE}₽ → {clientCostEE}₽) вполне достаточна. 
                        <strong> Основной доход компании идёт от продажи токенов, а не от перепродажи электроэнергии.</strong>
                        {' '}Повышение тарифа ЭЭ снизит привлекательность для клиентов.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

          {/* Показатели средние по пулу */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-400 mb-6">
            <h3 className="text-2xl font-bold text-green-900 mb-4">💰 Доходы и расходы (средние по пулу)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg border-2 border-green-300">
                <div className="text-sm text-gray-600 mb-1">💵 Доход от майнинга</div>
                <div className="text-2xl font-bold text-green-700">${miningRevenuePerTH.toFixed(5)}</div>
                <div className="text-xs text-gray-500">/TH/день</div>
                <div className="text-xs text-gray-600 mt-2">${(miningRevenuePerTH * 365).toFixed(2)}/год</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-2 border-red-300">
                <div className="text-sm text-gray-600 mb-1">⚡ Расход на ЭЭ</div>
                <div className="text-2xl font-bold text-red-700">${clientCostPerKwh.toFixed(5)}</div>
                <div className="text-xs text-gray-500">/TH/день</div>
                <div className="text-xs text-gray-600 mt-2">${(clientCostPerKwh * 365).toFixed(2)}/год</div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-4 rounded-lg border-2 border-green-500">
                <div className="text-sm text-gray-600 mb-1">✨ Чистая прибыль</div>
                <div className="text-3xl font-bold text-green-800">${avgNetDailyRevenue.toFixed(5)}</div>
                <div className="text-xs text-gray-500">/TH/день</div>
                <div className="text-xs font-semibold text-green-700 mt-2">${avgAnnualRevenue.toFixed(2)}/год</div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Энергопотребление (средне):</div>
                  <div className="text-gray-600">{avgEnergyPerTH.toFixed(3)} кВт/день на 1 TH</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700 mb-1">Маржа ЭЭ:</div>
                  <div className="text-gray-600">{((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% (не критично)</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Проверка требований */}
          <div className="bg-white p-6 rounded-xl border-2 border-purple-300 mb-6">
            <h3 className="text-xl font-bold text-purple-900 mb-4">🎯 Проверка целевых показателей</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className={`p-4 rounded-lg border-2 ${marginPercent >= 30 && marginPercent <= 40 ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                <div className="text-sm text-gray-600 mb-1">Наценка компании</div>
                <div className="text-3xl font-bold text-gray-800">{marginPercent}%</div>
                <div className="text-xs mt-2">
                  {marginPercent >= 30 && marginPercent <= 40 ? (
                    <span className="text-green-700">✅ В рамках целевых 30-40%</span>
                  ) : (
                    <span className="text-red-700">❌ Вне диапазона 30-40%</span>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${avgROI >= 33 ? 'bg-green-50 border-green-400' : 'bg-orange-50 border-orange-400'}`}>
                <div className="text-sm text-gray-600 mb-1">ROI инвестора</div>
                <div className="text-3xl font-bold text-gray-800">{avgROI.toFixed(1)}%</div>
                <div className="text-xs mt-2">
                  {avgROI >= 33 ? (
                    <span className="text-green-700">✅ Выше целевых 33%</span>
                  ) : (
                    <span className="text-orange-700">⚠️ Ниже целевых 33% (недостаток {(33 - avgROI).toFixed(1)}%)</span>
                  )}
                </div>
              </div>
              
              <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Маржа ЭЭ</div>
                <div className="text-3xl font-bold text-gray-800">{((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%</div>
                <div className="text-xs text-gray-600 mt-2">
                  ℹ️ Не критично (основной доход от токенов)
                </div>
              </div>
            </div>
            
            {/* Рекомендации */}
            <div className={`p-4 rounded-lg ${avgROI >= 33 && marginPercent >= 30 && marginPercent <= 40 ? 'bg-green-100 border-2 border-green-500' : 'bg-yellow-50 border-2 border-yellow-400'}`}>
              {avgROI >= 33 && marginPercent >= 30 && marginPercent <= 40 ? (
                <div>
                  <div className="font-bold text-green-900 text-lg mb-2">✅ Все требования выполнены!</div>
                  <div className="text-gray-700">Текущие параметры оптимальны для привлечения инвесторов.</div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-orange-900 mb-3">💡 Рекомендации для достижения целей:</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    {avgROI < 33 && (
                      <div className="bg-white p-3 rounded">
                        <strong>Для ROI 33%:</strong>
                        <div>• Дождаться роста BTC до ${Math.round(((tokenPrice * 0.33 / 365) + clientCostPerKwh) / btcPerTHPerDay).toLocaleString()}</div>
                        <div>• Или снизить цену токена до ${(avgAnnualRevenue / 0.33).toFixed(2)}</div>
                      </div>
                    )}
                    {!(marginPercent >= 30 && marginPercent <= 40) && (
                      <div className="bg-white p-3 rounded">
                        <strong>Наценка:</strong> Рекомендуем 30-40% для баланса интересов компании и клиентов
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Детали парка */}
          <div className="bg-white p-6 rounded-xl border-2 border-gray-300 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Детали парка оборудования</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Модель</th>
                    <th className="p-3 text-center">Доля в парке</th>
                    <th className="p-3 text-center">Мощность (TH)</th>
                    <th className="p-3 text-center">Количество</th>
                    <th className="p-3 text-center">Потребление (кВт)</th>
                    <th className="p-3 text-center">Себестоимость/TH</th>
                    <th className="p-3 text-center">Эффективность</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="bg-blue-50 hover:bg-blue-100">
                    <td className="p-3 font-semibold">T21 190TH</td>
                    <td className="p-3 text-center font-bold">{fleetT21Percent}%</td>
                    <td className="p-3 text-center">{t21TH.toFixed(0)} TH</td>
                    <td className="p-3 text-center">{t21Count} шт</td>
                    <td className="p-3 text-center">{(t21Count * miners.T21_190.power / 1000).toFixed(1)} кВт</td>
                    <td className="p-3 text-center">${t21CostPerTH.toFixed(2)}</td>
                    <td className="p-3 text-center">{miners.T21_190.efficiency} Вт/TH</td>
                  </tr>
                  <tr className="bg-green-50 hover:bg-green-100">
                    <td className="p-3 font-semibold">S21 Pro</td>
                    <td className="p-3 text-center font-bold">{fleetS21Percent}%</td>
                    <td className="p-3 text-center">{s21TH.toFixed(0)} TH</td>
                    <td className="p-3 text-center">{s21Count} шт</td>
                    <td className="p-3 text-center">{(s21Count * miners.S21Pro.power / 1000).toFixed(1)} кВт</td>
                    <td className="p-3 text-center">${s21CostPerTH.toFixed(2)}</td>
                    <td className="p-3 text-center">{miners.S21Pro.efficiency} Вт/TH</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-3">ИТОГО / СРЕДН</td>
                    <td className="p-3 text-center">100%</td>
                    <td className="p-3 text-center">{totalPoolTH.toLocaleString()} TH</td>
                    <td className="p-3 text-center">{t21Count + s21Count} шт</td>
                    <td className="p-3 text-center">{(totalPowerMW * 1000).toFixed(1)} кВт</td>
                    <td className="p-3 text-center">${avgCostPerTH.toFixed(2)}</td>
                    <td className="p-3 text-center">{avgEfficiency.toFixed(1)} Вт/TH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Кнопки навигации */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <Link 
          to="/litecoin" 
          className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">🪙</span>
          <span>Litecoin Pool</span>
        </Link>
        <Link 
          to="/details" 
          className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">📊</span>
          <span>Детальный анализ</span>
        </Link>
      </div>
    </div>
  )
}

export default App
