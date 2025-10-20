import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import './App.css'

function App() {
  // КЛЮЧЕВЫЕ ВВОДНЫЕ ПАРАМЕТРЫ
  
  // 1. Электроэнергия
  const [companyCostEE, setCompanyCostEE] = useState(5.4) // Себестоимость ЭЭ (₽/кВт⋅ч)
  const [clientCostEE, setClientCostEE] = useState(6.2) // Продажа ЭЭ клиенту (₽/кВт⋅ч)
  
  // 2. Токены
  // Фиксированная наценка 40%
  const marginPercent = 40
  
  // 3. Курс Bitcoin (из ViaBTC API)
  const [btcPriceNow, setBtcPriceNow] = useState(106497) // Курс BTC сейчас ($)
  const [btcPriceYear1, setBtcPriceYear1] = useState(150000) // Курс BTC через 1 год ($)
  const [btcPriceYear2, setBtcPriceYear2] = useState(200000) // Курс BTC через 2 года ($)
  
  // 4. Данные сети (из ViaBTC API)
  const [networkDifficulty, setNetworkDifficulty] = useState(146.72) // Сложность сети (T)
  const [btcPerTHPerDay, setBtcPerTHPerDay] = useState(0.00000043) // Доход BTC/TH/день
  
  // Вспомогательные константы (не редактируются пользователем)
  const usdtRate = 82 // Курс USDT к рублю
  const difficultyGrowth = 47.28 // Рост сложности в год (%)
  
  // Выбор оборудования
  const [selectedMiner, setSelectedMiner] = useState('T21')
  
  // Параметры оборудования
  const miners = {
    'T21': {
      name: 'Antminer T21',
      hashrate: 190, // TH
      power: 3610, // Вт
      price: 2050, // USD
      efficiency: 19 // Вт/TH
    },
    'S21Pro': {
      name: 'Antminer S21 Pro',
      hashrate: 245, // TH
      power: 3675, // Вт (из Excel файла)
      price: 3900, // USD (из Excel файла)
      efficiency: 15 // Вт/TH
    }
  }
  
  const currentMiner = miners[selectedMiner]
  
  // Расчёт себестоимости на основе выбранного оборудования
  const costPerTH = currentMiner.price / currentMiner.hashrate
  
  // Цена продажи 1 TH = себестоимость + 40% наценка
  const tokenPrice = costPerTH * (1 + marginPercent / 100)
  
  const calculatedMargin = ((tokenPrice / costPerTH - 1) * 100)
  
  // Расчётные значения на основе выбранного оборудования
  // Энергопотребление 1 TH за 24 часа с учётом +10% на инфраструктуру
  const energyPerTH = (currentMiner.power * 1.1 / currentMiner.hashrate) * 24 / 1000 // кВт/день
  const companyCostPerKwh = (companyCostEE / usdtRate) * energyPerTH // в $ за день на 1 TH
  const clientCostPerKwh = (clientCostEE / usdtRate) * energyPerTH // в $ за день на 1 TH
  const miningRevenuePerTH = btcPerTHPerDay * btcPriceNow // $ в день
  
  // Сценарии Bitcoin
  const btcScenarios = [
    { label: 'Медвежий', price: 50000 },
    { label: 'Низкий', price: 80000 },
    { label: 'Текущий', price: btcPriceNow },
    { label: 'Умеренный', price: 120000 },
    { label: 'Оптимистичный', price: 150000 },
    { label: 'Бычий', price: 200000 },
  ]
  
  // Сценарии продаж
  const scenarios = [
    { name: 'Базовый', tokens: 17150, asics: 90, thPerAsic: currentMiner.hashrate },
    { name: 'Средний', tokens: 30000, asics: 158, thPerAsic: currentMiner.hashrate },
    { name: 'Премиум', tokens: 75000, asics: 395, thPerAsic: currentMiner.hashrate },
  ]

  // Функция расчёта для одного сценария
  const calculateScenario = (tokens, asics, thPerAsic) => {
    const totalTH = asics * thPerAsic
    
    // 1. Доход от продажи токенов
    const profitPerToken = tokenPrice - costPerTH
    const tokenSalesRevenue = tokens * profitPerToken
    
    // 2. Доход от электроэнергии (за год)
    // Используем стоимость за день (уже умножено на energyPerTH)
    const companyCostPerDay = companyCostPerKwh
    const clientCostPerDay = clientCostPerKwh
    const energyProfitPerTHPerDay = clientCostPerDay - companyCostPerDay
    const energyProfitPerYear = energyProfitPerTHPerDay * totalTH * 365
    
    // 3. Инвестиции компании
    const totalInvestment = asics * thPerAsic * costPerTH
    
    // 4. Итоговый доход за год
    const totalRevenueYear1 = tokenSalesRevenue + energyProfitPerYear
    
    // 5. ROI для компании
    const companyROI = ((totalRevenueYear1 - totalInvestment) / totalInvestment) * 100
    
    // 6. Доходность для инвестора
    const investorDailyRevenue = miningRevenuePerTH - clientCostPerDay
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPrice) * 100
    const paybackYears = tokenPrice / investorAnnualRevenue
    
    return {
      tokens,
      asics,
      totalTH,
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

  // Расчёт всех сценариев
  const calculatedScenarios = useMemo(() => {
    return scenarios.map(s => ({
      ...s,
      ...calculateScenario(s.tokens, s.asics, s.thPerAsic)
    }))
  }, [costPerTH, tokenPrice, energyPerTH, companyCostPerKwh, clientCostPerKwh, miningRevenuePerTH])

  // Данные для графика (5 лет) с учётом роста сложности
  const chartData = useMemo(() => {
    const years = 5
    const data = []
    
    for (let year = 0; year <= years; year++) {
      const dataPoint = { year: `Год ${year}` }
      
      calculatedScenarios.forEach((scenario, idx) => {
        if (year === 0) {
          dataPoint[`scenario${idx}`] = 0
        } else {
          // Коэффициент снижения доходности из-за роста сложности
          // Доходность падает на difficultyGrowth% каждый год
          const miningRevenueFactor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
          
          // Доход от майнинга с учётом падения доходности (для инвесторов)
          const adjustedMiningRevenue = scenario.investorAnnualRevenue * miningRevenueFactor
          
          // Общий доход компании
          if (year === 1) {
            // Первый год: продажа токенов + ЭЭ
            dataPoint[`scenario${idx}`] = scenario.tokenSalesRevenue + scenario.energyProfitPerYear
          } else {
            // Последующие годы: только ЭЭ (доход от токенов был в первый год)
            dataPoint[`scenario${idx}`] = scenario.tokenSalesRevenue + (scenario.energyProfitPerYear * year)
          }
        }
      })
      
      data.push(dataPoint)
    }
    
    return data
  }, [calculatedScenarios, difficultyGrowth])

  // Функция экспорта в текст (упрощенный вариант вместо PDF)
  const exportToText = () => {
    let text = '═══════════════════════════════════════════\n'
    text += '   КАЛЬКУЛЯТОР ROI МАЙНИНГА - ОТЧЁТ\n'
    text += '═══════════════════════════════════════════\n\n'
    
    text += '📊 ВВОДНЫЕ ПАРАМЕТРЫ:\n\n'
    
    text += '🖥️ ОБОРУДОВАНИЕ:\n'
    text += `• Модель: ${currentMiner.name}\n`
    text += `• Хешрейт: ${currentMiner.hashrate} TH/s\n`
    text += `• Потребление: ${currentMiner.power} Вт\n`
    text += `• Цена: $${currentMiner.price.toLocaleString()}\n`
    text += `• Эффективность: ${currentMiner.efficiency} Вт/TH\n`
    text += `• Энергопотребление 1 TH: ${energyPerTH.toFixed(3)} кВт/день\n\n`
    
    text += '⚡ ЭЛЕКТРОЭНЕРГИЯ:\n'
    text += `• Себестоимость ЭЭ: ${companyCostEE}₽/кВт⋅ч ($${(companyCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Продажа ЭЭ клиенту: ${clientCostEE}₽/кВт⋅ч ($${(clientCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Маржа: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%\n\n`
    
    text += '💎 ТОКЕНЫ:\n'
    text += `• Себестоимость 1 TH: $${costPerTH.toFixed(2)}\n`
    text += `• Продажа 1 TH: $${tokenPrice}\n`
    text += `• Наценка: ${calculatedMargin.toFixed(1)}%\n`
    text += `• Прибыль от продажи: $${(tokenPrice - costPerTH).toFixed(2)}\n\n`
    
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
      const clientCost = (clientCostEE / usdtRate) * energyPerTH
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
    text += `• Наценка на токены: ${calculatedMargin.toFixed(1)}% ${calculatedMargin >= 30 && calculatedMargin <= 40 ? '✅' : '⚠️'}\n`
    text += `• Маржа ЭЭ: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% ${((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? '✅' : '⚠️'}\n\n`
    
    calculatedScenarios.forEach((s, idx) => {
      text += `\n${'═'.repeat(43)}\n`
      text += `📦 СЦЕНАРИЙ ${idx + 1}: ${s.name.toUpperCase()}\n`
      text += `${'═'.repeat(43)}\n`
      text += `• Токенов: ${s.tokens.toLocaleString()}\n`
      text += `• Асиков: ${s.asics}\n`
      text += `• Мощность: ${s.totalTH.toLocaleString()} TH\n`
      text += `• Инвестиции: $${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n\n`
      text += `💰 ДОХОД КОМПАНИИ (год 1):\n`
      text += `• От продажи токенов: $${s.tokenSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• От электроэнергии: $${s.energyProfitPerYear.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• ИТОГО: $${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• ROI компании: ${s.companyROI.toFixed(1)}%\n\n`
      text += `📈 ДОХОДНОСТЬ ИНВЕСТОРА (при текущей сложности):\n`
      text += `• Чистый доход: $${s.investorDailyRevenue.toFixed(4)}/день\n`
      text += `• Годовой доход: $${s.investorAnnualRevenue.toFixed(2)}\n`
      text += `• ROI: ${s.investorROI.toFixed(2)}% годовых\n`
      text += `• Окупаемость: ${s.paybackYears.toFixed(2)} лет\n\n`
      
      // Добавим прогноз с учётом роста сложности
      text += `📉 ПРОГНОЗ С УЧЁТОМ РОСТА СЛОЖНОСТИ (${difficultyGrowth}%):\n`
      for (let year = 1; year <= 3; year++) {
        const factor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
        const adjustedRevenue = s.investorAnnualRevenue * factor
        const adjustedROI = (adjustedRevenue / tokenPrice) * 100
        text += `• Год ${year}: доход $${adjustedRevenue.toFixed(2)} (ROI ${adjustedROI.toFixed(2)}%)\n`
      }
    })
    
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
      <div className="max-w-7xl mx-auto">
        {/* Информационные карточки */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                🖥️ {currentMiner.name} ({currentMiner.hashrate} TH, {currentMiner.power} Вт)
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                📊 Сложность: {networkDifficulty}T | Рост: ~{difficultyGrowth}% в год
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                ₿ BTC: ${btcPriceNow.toLocaleString()} | {btcPerTHPerDay.toFixed(8)} BTC/TH/день
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white text-sm">
                📡 <a href="https://www.viabtc.com/res/tools/calculator?coin=BTC" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">ViaBTC API</a>
              </p>
            </div>
          </div>
        </div>

        {/* Панель настроек */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Вводные параметры</h2>
          
          {/* 0. ВЫБОР ОБОРУДОВАНИЯ */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-indigo-500">🖥️</span> Выбор оборудования
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(miners).map(([key, miner]) => (
                <div
                  key={key}
                  onClick={() => setSelectedMiner(key)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedMiner === key
                      ? 'bg-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-bold text-lg mb-2">{miner.name}</div>
                  <div className="text-sm space-y-1">
                    <div>⚡ Хешрейт: {miner.hashrate} TH/s</div>
                    <div>🔌 Потребление: {miner.power} Вт</div>
                    <div>💰 Цена: ${miner.price.toLocaleString()}</div>
                    <div>📊 Эффективность: {miner.efficiency} Вт/TH</div>
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <strong>Себестоимость 1 TH: ${(miner.price / miner.hashrate).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
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

          {/* 2. ТОКЕНЫ */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-purple-500">💎</span> Токены (1 TH)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Себестоимость 1 TH ($)
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${costPerTH.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ${currentMiner.price} / {currentMiner.hashrate} TH
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-300">
                <label className="block text-sm font-semibold text-purple-700 mb-2">
                  💰 Продажа 1 TH ($)
                </label>
                <div className="text-3xl font-bold text-purple-700 mb-1">
                  ${tokenPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Автоматически: себестоимость ${costPerTH.toFixed(2)} + 40% наценка
                </div>
                <div className="text-xs text-green-600 font-semibold mt-1">
                  ✓ Фиксированная наценка {marginPercent}%
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Наша наценка (%)
                </label>
                <div className="text-2xl font-bold text-green-700">
                  {calculatedMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Прибыль: ${(tokenPrice - costPerTH).toFixed(2)}
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
              💡 <strong>Наценка:</strong> {((tokenPrice / costPerTH - 1) * 100).toFixed(1)}% 
              {' | '}
              <strong>Прибыль от токена:</strong> ${(tokenPrice - costPerTH).toFixed(2)}
              {' | '}
              <strong>ROI инвестора:</strong> ~{calculatedScenarios[0]?.investorROI.toFixed(1)}% годовых
      </div>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={exportToText}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg whitespace-nowrap"
              >
                📄 Экспорт TXT
              </button>
              <button
                onClick={exportToExcel}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg whitespace-nowrap"
              >
                📊 Экспорт Excel (с формулами)
        </button>
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
                    = {clientCostEE}₽ / {usdtRate} × {energyPerTH.toFixed(3)} кВт = ${clientCostPerKwh.toFixed(5)}/день
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    * Энергопотребление 1 TH = ({currentMiner.power} Вт × 1.1) / {currentMiner.hashrate} TH × 24ч / 1000 = {energyPerTH.toFixed(3)} кВт/день
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
                    = ${currentMiner.price.toLocaleString()} / {currentMiner.hashrate} TH = ${costPerTH.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">2️⃣ Прибыль от продажи токена (единовременно):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Цена токена - Себестоимость
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${tokenPrice} - ${costPerTH.toFixed(2)} = ${(tokenPrice - costPerTH).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Наценка: {calculatedMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">3️⃣ Прибыль от перепродажи ЭЭ (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = (Тариф клиента - Себестоимость ЭЭ) / Курс × Энергопотребление
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ({clientCostEE}₽ - {companyCostEE}₽) / {usdtRate} × {energyPerTH.toFixed(3)} кВт = ${(clientCostPerKwh - companyCostPerKwh).toFixed(5)}/день
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
                    = ${(tokenPrice - costPerTH).toFixed(2)} + ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} = ${((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg">
                  <div className="font-bold mb-2">5️⃣ ROI компании (первый год):</div>
                  <div className="font-mono text-xs bg-white/20 p-2 rounded mb-1">
                    = (Общий доход / Себестоимость - 1) × 100%
                  </div>
                  <div className="text-xl font-bold">
                    = (${((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} / ${costPerTH.toFixed(2)} - 1) × 100% = {((((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365) / costPerTH - 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    Маржа от ЭЭ: {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Важные замечания */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Важные факторы:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Рост сложности сети:</strong> {difficultyGrowth}% в год снижает доходность майнинга на тот же процент</li>
              <li>• <strong>Изменение цены BTC:</strong> напрямую влияет на валовый доход инвестора</li>
              <li>• <strong>Срок жизни оборудования:</strong> ~3 года, после чего эффективность падает</li>
              <li>• <strong>Инфраструктура:</strong> +10% к энергопотреблению (сеть, охлаждение, контейнер)</li>
              <li>• <strong>Для компании:</strong> доход от токенов - единовременный, от ЭЭ - ежегодный</li>
              <li>• <strong>Для инвестора:</strong> чистый доход = майнинг минус оплата ЭЭ</li>
            </ul>
          </div>
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
                  const clientCost = (clientCostEE / usdtRate) * energyPerTH // Затраты на ЭЭ за день на 1 TH
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
                      Текущая наценка: <span className={`font-bold ${calculatedMargin >= 30 && calculatedMargin <= 40 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedMargin.toFixed(1)}%
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

          {/* Симулятор оптимальной цены */}
          <div className="bg-white p-6 rounded-xl border-2 border-purple-300 mb-6">
            <h3 className="text-xl font-bold text-purple-900 mb-4">🔧 Подбор оптимальной цены (сравнение T21 vs S21 Pro)</h3>
            
            {(() => {
              // Функция расчёта для конкретного оборудования
              const calculateForMiner = (miner, minerName) => {
                const costPerTH_m = miner.price / miner.hashrate
                const energyPerTH_m = (miner.power * 1.1 / miner.hashrate) * 24 / 1000
                const clientCostPerKwh_m = (clientCostEE / usdtRate) * energyPerTH_m
                const currentAnnualRevenue_m = (miningRevenuePerTH - clientCostPerKwh_m) * 365
                const calculatedMargin_m = ((tokenPrice / costPerTH_m - 1) * 100)
                
                return {
                  name: minerName,
                  costPerTH: costPerTH_m,
                  energyPerTH: energyPerTH_m,
                  currentAnnualRevenue: currentAnnualRevenue_m,
                  calculatedMargin: calculatedMargin_m,
                  minPriceForMargin: costPerTH_m * 1.30,
                  maxPriceForMargin: costPerTH_m * 1.40,
                  optimalTokenPriceForRoi: currentAnnualRevenue_m / 0.33,
                  neededBtcPriceForTarget: ((tokenPrice * 0.33) / 365 + clientCostPerKwh_m) / btcPerTHPerDay,
                  checkMargin: calculatedMargin_m >= 30 && calculatedMargin_m <= 40,
                  checkRoi: (currentAnnualRevenue_m / tokenPrice * 100) >= 33
                }
              }
              
              const t21Data = calculateForMiner(miners.T21, 'T21')
              const s21Data = calculateForMiner(miners.S21Pro, 'S21 Pro')
              const eeMargin = ((clientCostEE - companyCostEE) / companyCostEE * 100)
              
              return (
                <>
                  {/* Сравнительная таблица T21 vs S21 Pro */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                      <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <tr>
                          <th className="p-3 text-left">Параметр</th>
                          <th className="p-3 text-center bg-blue-600">{t21Data.name}</th>
                          <th className="p-3 text-center bg-green-600">{s21Data.name}</th>
                          <th className="p-3 text-center">Разница</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">Себестоимость 1 TH</td>
                          <td className="p-3 text-center">${t21Data.costPerTH.toFixed(2)}</td>
                          <td className="p-3 text-center">${s21Data.costPerTH.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-green-600">${(t21Data.costPerTH - s21Data.costPerTH).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">Годовой доход ($/TH)</td>
                          <td className="p-3 text-center">${t21Data.currentAnnualRevenue.toFixed(2)}</td>
                          <td className="p-3 text-center">${s21Data.currentAnnualRevenue.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-green-600">${(s21Data.currentAnnualRevenue - t21Data.currentAnnualRevenue).toFixed(2)}</td>
                        </tr>
                        <tr className="border-b bg-purple-50">
                          <td className="p-3 font-semibold">Наценка при $${tokenPrice}</td>
                          <td className={`p-3 text-center font-bold ${t21Data.checkMargin ? 'text-green-600' : 'text-red-600'}`}>
                            {t21Data.calculatedMargin.toFixed(1)}% {t21Data.checkMargin ? '✅' : '❌'}
                          </td>
                          <td className={`p-3 text-center font-bold ${s21Data.checkMargin ? 'text-green-600' : 'text-red-600'}`}>
                            {s21Data.calculatedMargin.toFixed(1)}% {s21Data.checkMargin ? '✅' : '❌'}
                          </td>
                          <td className="p-3 text-center text-gray-500">Цель: 30-40%</td>
                        </tr>
                        <tr className="border-b bg-blue-50">
                          <td className="p-3 font-semibold">ROI клиента при $${tokenPrice}</td>
                          <td className={`p-3 text-center font-bold ${t21Data.checkRoi ? 'text-green-600' : 'text-red-600'}`}>
                            {(t21Data.currentAnnualRevenue / tokenPrice * 100).toFixed(1)}% {t21Data.checkRoi ? '✅' : '❌'}
                          </td>
                          <td className={`p-3 text-center font-bold ${s21Data.checkRoi ? 'text-green-600' : 'text-red-600'}`}>
                            {(s21Data.currentAnnualRevenue / tokenPrice * 100).toFixed(1)}% {s21Data.checkRoi ? '✅' : '❌'}
                          </td>
                          <td className="p-3 text-center text-gray-500">Цель: ≥33%</td>
                        </tr>
                        <tr className="border-b bg-green-50">
                          <td className="p-3 font-semibold">💰 Для наценки 30%</td>
                          <td className="p-3 text-center font-bold text-purple-700">${t21Data.minPriceForMargin.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-purple-700">${s21Data.minPriceForMargin.toFixed(2)}</td>
                          <td className="p-3 text-center text-gray-500">Min цена</td>
                        </tr>
                        <tr className="border-b bg-green-50">
                          <td className="p-3 font-semibold">💰 Для наценки 40%</td>
                          <td className="p-3 text-center font-bold text-purple-700">${t21Data.maxPriceForMargin.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-purple-700">${s21Data.maxPriceForMargin.toFixed(2)}</td>
                          <td className="p-3 text-center text-gray-500">Max цена</td>
                        </tr>
                        <tr className="border-b bg-yellow-50">
                          <td className="p-3 font-semibold">🎯 Для ROI 33%</td>
                          <td className="p-3 text-center font-bold text-blue-700">${t21Data.optimalTokenPriceForRoi.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-blue-700">${s21Data.optimalTokenPriceForRoi.toFixed(2)}</td>
                          <td className="p-3 text-center text-gray-500">Опт. цена</td>
                        </tr>
                        <tr className="bg-orange-50">
                          <td className="p-3 font-semibold">🚀 Или BTC до:</td>
                          <td className="p-3 text-center font-bold text-orange-700">${Math.round(t21Data.neededBtcPriceForTarget).toLocaleString()}</td>
                          <td className="p-3 text-center font-bold text-orange-700">${Math.round(s21Data.neededBtcPriceForTarget).toLocaleString()}</td>
                          <td className="p-3 text-center text-gray-500">Рост на {((t21Data.neededBtcPriceForTarget / btcPriceNow - 1) * 100).toFixed(0)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Итоговые рекомендации */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* T21 */}
                    <div className={`p-4 rounded-xl border-2 ${t21Data.checkMargin && t21Data.checkRoi ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        {t21Data.checkMargin && t21Data.checkRoi ? '✅' : '⚠️'} {t21Data.name}
                      </h4>
                      {t21Data.checkMargin && t21Data.checkRoi ? (
                        <div className="text-green-800">
                          <div className="font-semibold">Все требования выполнены!</div>
                          <div className="text-sm mt-1">Цена токена ${tokenPrice} оптимальна</div>
                        </div>
                      ) : (
                        <div className="text-gray-800 space-y-2 text-sm">
                          {!t21Data.checkMargin && (
                            <div>❌ Наценка {t21Data.calculatedMargin.toFixed(1)}% (нужно 30-40%)</div>
                          )}
                          {!t21Data.checkRoi && (
                            <div>❌ ROI {(t21Data.currentAnnualRevenue / tokenPrice * 100).toFixed(1)}% (нужно ≥33%)</div>
                          )}
                          <div className="font-semibold text-purple-700 mt-2">
                            💡 Рекомендуемая цена: ${Math.max(t21Data.minPriceForMargin, Math.min(t21Data.maxPriceForMargin, t21Data.optimalTokenPriceForRoi)).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* S21 Pro */}
                    <div className={`p-4 rounded-xl border-2 ${s21Data.checkMargin && s21Data.checkRoi ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                      <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                        {s21Data.checkMargin && s21Data.checkRoi ? '✅' : '⚠️'} {s21Data.name}
                      </h4>
                      {s21Data.checkMargin && s21Data.checkRoi ? (
                        <div className="text-green-800">
                          <div className="font-semibold">Все требования выполнены!</div>
                          <div className="text-sm mt-1">Цена токена ${tokenPrice} оптимальна</div>
                        </div>
                      ) : (
                        <div className="text-gray-800 space-y-2 text-sm">
                          {!s21Data.checkMargin && (
                            <div>❌ Наценка {s21Data.calculatedMargin.toFixed(1)}% (нужно 30-40%)</div>
                          )}
                          {!s21Data.checkRoi && (
                            <div>❌ ROI {(s21Data.currentAnnualRevenue / tokenPrice * 100).toFixed(1)}% (нужно ≥33%)</div>
                          )}
                          <div className="font-semibold text-purple-700 mt-2">
                            💡 Рекомендуемая цена: ${Math.max(s21Data.minPriceForMargin, Math.min(s21Data.maxPriceForMargin, s21Data.optimalTokenPriceForRoi)).toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Справка о марже ЭЭ */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-300 text-sm text-gray-700">
                    <strong>ℹ️ Маржа ЭЭ:</strong> {eeMargin.toFixed(1)}% ({companyCostEE}₽ → {clientCostEE}₽) - не критична, основной доход от продажи токенов.
                  </div>
                </>
              )
            })()}
          </div>

          {/* Симуляция на 3 года */}
          <div className="bg-white p-6 rounded-xl border-2 border-purple-300">
            <h3 className="text-xl font-bold text-purple-900 mb-4">📅 Прогноз доходности на 3 года</h3>
            <p className="text-sm text-gray-600 mb-4">
              С учётом падения доходности на {difficultyGrowth}% в год и роста BTC на 10-15% в год
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">Год</th>
                    <th className="px-4 py-3 text-center">Цена BTC (прогноз +12.5%/год)</th>
                    <th className="px-4 py-3 text-center">Доходность майнинга</th>
                    <th className="px-4 py-3 text-center">Чистый доход</th>
                    <th className="px-4 py-3 text-center">ROI клиента</th>
                    <th className="px-4 py-3 text-center rounded-tr-lg bg-green-600">🎯 BTC для ROI 33%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3].map((year) => {
                    // Предполагаем рост BTC на 12.5% в год (среднее между 10-15%)
                    const btcGrowth = 1.125
                    const btcPriceYear = btcPriceNow * Math.pow(btcGrowth, year)
                    
                    // Падение доходности из-за роста сложности
                    const difficultyFactor = Math.pow(1 - difficultyGrowth / 100, year)
                    
                    // Скорректированный доход
                    const adjustedMiningRev = (btcPerTHPerDay * btcPriceYear) * difficultyFactor
                    const netRevenue = adjustedMiningRev - clientCostPerKwh
                    const annualRevenue = netRevenue * 365
                    const roi = (annualRevenue / tokenPrice) * 100
                    
                    // Рассчитываем необходимую цену BTC для ROI 33%
                    const targetAnnualRevenue = tokenPrice * 0.33 // Нужный годовой доход
                    const targetDailyRevenue = targetAnnualRevenue / 365
                    const targetMiningRevenue = targetDailyRevenue + clientCostPerKwh
                    const neededBtcPrice = targetMiningRevenue / (btcPerTHPerDay * difficultyFactor)
                    const growthNeeded = ((neededBtcPrice / btcPriceNow - 1) * 100)
                    
                    const rowColor = roi >= 33 ? 'bg-green-50' : roi >= 20 ? 'bg-yellow-50' : 'bg-red-50'
                    
                    return (
                      <tr key={year} className={rowColor}>
                        <td className="px-4 py-3 font-bold">Год {year}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          ${Math.round(btcPriceYear).toLocaleString()}
                          <div className="text-xs text-gray-500">+{((btcPriceYear / btcPriceNow - 1) * 100).toFixed(0)}% от сейчас</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(difficultyFactor * 100).toFixed(1)}% от начальной
                          <div className="text-xs text-gray-500">${adjustedMiningRev.toFixed(5)}/день</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          ${netRevenue.toFixed(5)}/день
                          <div className="text-xs text-gray-500">${annualRevenue.toFixed(2)}/год</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-lg ${
                            roi >= 33 ? 'text-green-700' : roi >= 20 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {roi.toFixed(1)}% {roi >= 33 ? '✅' : roi >= 20 ? '⚠️' : '❌'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center bg-green-50">
                          <div className="font-bold text-green-700 text-lg">
                            ${Math.round(neededBtcPrice).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {growthNeeded > 0 ? `↗️ +${growthNeeded.toFixed(0)}%` : `↘️ ${growthNeeded.toFixed(0)}%`} от сейчас
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-400">
                <p className="font-bold text-green-900 mb-2">🎯 Реалистичные ожидания для целевого ROI 33%:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white p-3 rounded">
                    <div className="font-semibold text-gray-700">Год 1:</div>
                    <div className="text-lg font-bold text-green-700">
                      ${Math.round((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 1))).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      +{(((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 1)) / btcPriceNow - 1) * 100).toFixed(0)}% роста
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="font-semibold text-gray-700">Год 2:</div>
                    <div className="text-lg font-bold text-orange-700">
                      ${Math.round((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 2))).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      +{(((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 2)) / btcPriceNow - 1) * 100).toFixed(0)}% роста
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <div className="font-semibold text-gray-700">Год 3:</div>
                    <div className="text-lg font-bold text-red-700">
                      ${Math.round((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 3))).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      +{(((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 3)) / btcPriceNow - 1) * 100).toFixed(0)}% роста
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  💡 <strong>Важно:</strong> Даже с ростом BTC на 12.5% в год, доходность снижается из-за роста сложности {difficultyGrowth}% в год. 
                  Для поддержания ROI 33% на протяжении 3 лет, курс BTC должен расти значительно быстрее - на {(((tokenPrice * 0.33 / 365 + clientCostPerKwh) / (btcPerTHPerDay * Math.pow(1 - difficultyGrowth / 100, 3)) / btcPriceNow - 1) * 100 / 3).toFixed(0)}% в год.
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-300">
                <p className="text-sm text-gray-700">
                  ⚠️ <strong>Вывод:</strong> При текущей цене токена $25 и сложности сети, для достижения целевого ROI 33% нужен экстремальный рост BTC. 
                  Рекомендуется снизить цену токена до $12-14 для более реалистичных ожиданий от рынка.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Калькулятор оптимальных параметров */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
            🎯 Рекомендации для целевой доходности
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
              <div className="text-sm text-gray-600 mb-1">Цель клиента</div>
              <div className="text-2xl font-bold text-green-700">33% ROI</div>
              <div className="text-xs text-gray-500 mt-1">С учётом роста сложности + роста BTC 10-15%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Наша прибыль от токенов</div>
              <div className="text-2xl font-bold text-blue-700">30-40%</div>
              <div className="text-xs text-gray-500 mt-1">Наценка на оборудование</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
              <div className="text-sm text-gray-600 mb-1">Наша прибыль от ЭЭ</div>
              <div className="text-2xl font-bold text-purple-700">≥30%</div>
              <div className="text-xs text-gray-500 mt-1">С учётом налогов</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-bold text-gray-800 mb-2">💡 Текущие показатели:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Наценка на токены:</span>
                <span className={`ml-2 font-bold ${calculatedMargin >= 30 && calculatedMargin <= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculatedMargin.toFixed(1)}% {calculatedMargin >= 30 && calculatedMargin <= 40 ? '✅' : '⚠️'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">ROI инвестора (год 1):</span>
                <span className={`ml-2 font-bold ${calculatedScenarios[0]?.investorROI >= 33 ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculatedScenarios[0]?.investorROI.toFixed(1)}% {calculatedScenarios[0]?.investorROI >= 33 ? '✅' : '⚠️'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Маржа ЭЭ:</span>
                <span className={`ml-2 font-bold ${((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                  {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% {((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? '✅' : '⚠️'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
            <h3 className="font-bold text-yellow-900 mb-2">📝 Рекомендации:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Для достижения ROI клиента 33% при росте сложности 47% нужен рост BTC минимум на 10-15% в год</li>
              <li>• При текущей цене BTC ${btcPriceNow.toLocaleString()} ROI составляет ~{calculatedScenarios[0]?.investorROI.toFixed(1)}%</li>
              <li>• Для компенсации роста сложности рекомендуется прогноз роста BTC до ${Math.round(btcPriceNow * 1.5).toLocaleString()} через 1-2 года</li>
              <li>• Срок жизни оборудования: 3 года - учитывайте снижение доходности каждый год на {difficultyGrowth}%</li>
            </ul>
          </div>
        </div>

        {/* Информация о росте сложности */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-orange-900 mb-2">
                Важно: Влияние роста сложности сети
              </h3>
              <p className="text-gray-700 mb-3">
                Сложность сети Bitcoin растёт со скоростью ~<strong>{difficultyGrowth}% в год</strong> (данные за ноя 2024 - окт 2025). 
                Это означает, что доходность майнинга для инвесторов снижается на тот же процент при неизменной цене BTC.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 1</div>
                  <div className="text-lg font-bold text-gray-900">
                    ROI: {calculatedScenarios[0]?.investorROI.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 2</div>
                  <div className="text-lg font-bold text-orange-700">
                    ROI: {((calculatedScenarios[0]?.investorROI || 0) * (1 - difficultyGrowth/100)).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 3</div>
                  <div className="text-lg font-bold text-red-700">
                    ROI: {((calculatedScenarios[0]?.investorROI || 0) * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Сравнительная таблица */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Сравнение сценариев</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Параметр</th>
                  {calculatedScenarios.map((s, idx) => (
                    <th key={idx} className={`px-4 py-3 text-center ${idx === calculatedScenarios.length - 1 ? 'rounded-tr-lg' : ''}`}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Токенов</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.tokens.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Асиков</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.asics}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Мощность (TH)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.totalTH.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-red-50">
                  <td className="px-4 py-3 font-semibold text-red-700">💸 Инвестиции</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-red-700">
                      ${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">От продажи токенов</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.tokenSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">От ЭЭ (год)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.energyProfitPerYear.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-green-50">
                  <td className="px-4 py-3 font-semibold text-green-700">💰 Итого за год 1</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-green-700 text-lg">
                      ${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-blue-700">🎯 ROI компании</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-blue-700 text-lg">
                      {s.companyROI.toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Доход инвестора (день)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.investorDailyRevenue.toFixed(4)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Доход инвестора (год)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.investorAnnualRevenue.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-4 py-3 font-semibold text-purple-700">📈 ROI инвестора</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-purple-700">
                      {s.investorROI.toFixed(2)}% годовых
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-orange-50">
                  <td className="px-4 py-3 font-semibold text-orange-700">⏱️ Окупаемость</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-orange-700">
                      {s.paybackYears.toFixed(2)} лет
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* График */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📈 Динамика дохода компании (5 лет)</h2>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScenario0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScenario1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScenario2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="scenario0" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorScenario0)" 
                name={calculatedScenarios[0]?.name}
              />
              <Area 
                type="monotone" 
                dataKey="scenario1" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorScenario1)" 
                name={calculatedScenarios[1]?.name}
              />
              <Area 
                type="monotone" 
                dataKey="scenario2" 
                stroke="#ffc658" 
                fillOpacity={1} 
                fill="url(#colorScenario2)" 
                name={calculatedScenarios[2]?.name}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Карточки с ключевыми метриками */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {calculatedScenarios.map((s, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-6 border-2 border-gray-200 hover:border-purple-400 transition-all">
              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                <span>{s.name}</span>
                <span className="text-3xl">
                  {idx === 0 ? '🥉' : idx === 1 ? '🥈' : '🥇'}
                </span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Мощность:</span>
                  <span className="font-bold text-lg">{s.totalTH.toLocaleString()} TH</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Инвестиции:</span>
                  <span className="font-bold text-lg text-red-600">
                    ${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Доход (год 1):</span>
                  <span className="font-bold text-lg text-green-600">
                    ${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg">
                  <span className="text-gray-700 font-semibold">ROI компании:</span>
                  <span className="font-bold text-xl text-purple-700">
                    {s.companyROI.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-lg">
                  <span className="text-gray-700 font-semibold">ROI инвестора:</span>
                  <span className="font-bold text-xl text-blue-700">
                    {s.investorROI.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Футер */}
        <div className="text-center text-white/80 mt-12">
          <p className="text-sm">
            💡 Калькулятор основан на текущих рыночных условиях. Фактические результаты могут отличаться.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
