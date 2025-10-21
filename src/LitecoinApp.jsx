import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function LitecoinApp() {
  // КЛЮЧЕВЫЕ ВВОДНЫЕ ПАРАМЕТРЫ
  
  // 1. Электроэнергия
  const [companyCostEE, setCompanyCostEE] = useState(5.4) // Себестоимость ЭЭ (₽/кВт⋅ч)
  const [clientCostEE, setClientCostEE] = useState(6.2) // Продажа ЭЭ клиенту (₽/кВт⋅ч)
  
  // 2. Состав парка оборудования
  const [totalPoolMH, setTotalPoolMH] = useState(16000) // Общая мощность пула в MH (1 асик)
  const [marginPercent, setMarginPercent] = useState(30) // Наценка компании на токены (%)
  
  // 3. Курсы
  const [ltcPriceNow, setLtcPriceNow] = useState(95.43) // Курс LTC сейчас ($)
  const [dogePriceNow, setDogePriceNow] = useState(0.2027) // Курс DOGE сейчас ($)
  const [ltcPerMHPerDay, setLtcPerMHPerDay] = useState(0.0001182) // LTC за MH/s в день (из ViaBTC)
  const [dogePerMHPerDay, setDogePerMHPerDay] = useState(0.00405075) // DOGE за MH/s в день (из ViaBTC)

  // Вспомогательные константы
  const usdtRate = 82 // Курс USDT к рублю
  const difficultyGrowth = 30 // Рост сложности в год (%) - для LTC меньше чем для BTC
  
  // Параметры оборудования - Antminer L9
  const miner = {
    name: 'Antminer L9',
    hashrate: 16000, // MH/s
    power: 3360, // Вт
    price: 5250, // USD
    efficiency: 0.21 // Вт/MH
  }
  
  // РАСЧЁТ ПОКАЗАТЕЛЕЙ ПУЛА
  const poolCalculations = useMemo(() => {
    // Количество асиков
    const minerCount = Math.ceil(totalPoolMH / miner.hashrate)
    
    // Себестоимость 1 MH
    const costPerMH = miner.price / miner.hashrate
    
    // Общее потребление пула (МВт)
    const totalPowerWatts = minerCount * miner.power
    const totalPowerMW = totalPowerWatts / 1000000
    
    return {
      minerCount,
      costPerMH,
      totalPowerMW,
      totalPowerWatts
    }
  }, [totalPoolMH])

  const { minerCount, costPerMH, totalPowerMW, totalPowerWatts } = poolCalculations
  
  // Средневзвешенное энергопотребление 1 MH за 24 часа (кВт/день)
  const avgEnergyPerMH = (miner.efficiency * 24) / 1000
  
  // Цена токена H2C-LTC (1 токен = 1 MH в пуле)
  const tokenPrice = costPerMH * (1 + marginPercent / 100)
  
  // Добыча LTC и DOGE за день
  const dailyLTCProduction = useMemo(() => {
    return ltcPerMHPerDay * totalPoolMH
  }, [ltcPerMHPerDay, totalPoolMH])
  
  const dailyDOGEProduction = useMemo(() => {
    return dogePerMHPerDay * totalPoolMH
  }, [dogePerMHPerDay, totalPoolMH])
  
  // Затраты и доходы
  const companyCostPerKwh = (companyCostEE / usdtRate) * avgEnergyPerMH
  const clientCostPerKwh = (clientCostEE / usdtRate) * avgEnergyPerMH * 1.1 // +10% наценка на ЭЭ
  
  // Доход от майнинга на 1 MH в день
  const miningRevenuePerMH = (ltcPerMHPerDay * ltcPriceNow) + (dogePerMHPerDay * dogePriceNow)
  
  // Функция расчета сценария
  const calculateScenario = (scenarioMH) => {
    // 1. Инвестиции компании
    const totalInvestment = scenarioMH * costPerMH
    
    // 2. Доход от продажи токенов (единовременный)
    const tokenSalesRevenue = scenarioMH * (tokenPrice - costPerMH)
    
    // 3. Доход от ЭЭ (в год)
    const energyProfitPerDay = scenarioMH * (clientCostPerKwh - companyCostPerKwh)
    const energyProfitPerYear = energyProfitPerDay * 365
    
    // 4. Общий доход компании (год 1)
    const totalRevenueYear1 = tokenSalesRevenue + energyProfitPerYear
    
    // 5. ROI для компании
    const companyROI = (totalRevenueYear1 / totalInvestment) * 100
    
    // 6. Доходность для инвестора
    const investorDailyRevenue = miningRevenuePerMH - clientCostPerKwh
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPrice) * 100
    const paybackYears = investorAnnualRevenue > 0 ? tokenPrice / investorAnnualRevenue : 999
    
    return {
      totalMH: scenarioMH,
      tokens: scenarioMH,
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
    return calculateScenario(totalPoolMH)
  }, [totalPoolMH, costPerMH, tokenPrice, avgEnergyPerMH, companyCostPerKwh, clientCostPerKwh, miningRevenuePerMH])

  // Средние показатели для всех сценариев
  const avgAnnualRevenue = poolCalculation.investorAnnualRevenue
  const avgROI = poolCalculation.investorROI

  // Данные для графика (5 лет)
  const chartData = useMemo(() => {
    const data = []
    for (let year = 0; year <= 5; year++) {
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
        dataPoint.clientElectricityCost = clientCostPerKwh * totalPoolMH * 365
        
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
  }, [poolCalculation, clientCostPerKwh, totalPoolMH, difficultyGrowth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 pb-20">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 text-white py-8 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">🪙</span> HASH2CASH Litecoin Pool
              </h1>
              <p className="text-blue-100 text-lg">
                Калькулятор доходности майнинга LTC + DOGE на Antminer L9
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/" 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                ₿ Bitcoin Pool
              </Link>
              <Link 
                to="/details" 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                📊 Детальный анализ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Закрепленная панель статистики пула */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Метрики */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Мощность пула</div>
              <div className="text-white font-bold text-lg">{totalPoolMH.toLocaleString()} MH/s</div>
              <div className="text-white/60 text-xs mt-1">
                = {minerCount} × {miner.hashrate.toLocaleString()} MH/s
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Потребление</div>
              <div className="text-white font-bold text-lg">{totalPowerMW.toFixed(2)} МВт</div>
              <div className="text-white/60 text-xs mt-1">
                = {totalPowerWatts.toLocaleString()}W
              </div>
              <div className="text-white/50 text-xs mt-1">
                {minerCount} × {miner.power}W
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Эффективность</div>
              <div className="text-white font-bold text-lg">{miner.efficiency.toFixed(2)} Вт/MH</div>
              <div className="text-white/60 text-xs mt-1">
                = {miner.power}W ÷ {miner.hashrate.toLocaleString()} MH/s
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">🪙 Litecoin</div>
              <div className="text-white font-bold text-lg">${ltcPriceNow.toFixed(2)}</div>
              <div className="text-white/60 text-xs mt-1">
                (из ViaBTC API)
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">🐕 Dogecoin</div>
              <div className="text-white font-bold text-lg">${dogePriceNow.toFixed(4)}</div>
              <div className="text-white/60 text-xs mt-1">
                (из ViaBTC API)
              </div>
            </div>
          </div>
          
          {/* Ползунок наценки на токены */}
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
                  {marginPercent}% наценка = ${(costPerMH * (1 + marginPercent / 100)).toFixed(2)} за токен
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          
          {/* Основные показатели */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Ключевые показатели пула</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Мощность</div>
                <div className="text-3xl font-bold text-blue-700">{totalPoolMH.toLocaleString()}</div>
                <div className="text-xs text-gray-500">MH/s</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Асиков</div>
                <div className="text-3xl font-bold text-green-700">{minerCount}</div>
                <div className="text-xs text-gray-500">Antminer L9</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Потребление</div>
                <div className="text-3xl font-bold text-purple-700">{totalPowerMW.toFixed(2)}</div>
                <div className="text-xs text-gray-500">МВт</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">🪙 Добыто LTC/день</div>
                <div className="text-2xl font-bold text-blue-700">{dailyLTCProduction.toFixed(4)}</div>
                <div className="text-xs text-gray-500">LTC/день</div>
                <div className="text-xs text-gray-500 mt-1">
                  = {ltcPerMHPerDay.toFixed(7)} × {totalPoolMH.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-200">
                <div className="text-sm text-gray-600 mb-1">🐕 Добыто DOGE/день (бонус)</div>
                <div className="text-2xl font-bold text-orange-700">{dailyDOGEProduction.toFixed(2)}</div>
                <div className="text-xs text-gray-500">DOGE/день (merged mining)</div>
                <div className="text-xs text-gray-500 mt-1">
                  = {dogePerMHPerDay.toFixed(8)} × {totalPoolMH.toLocaleString()}
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">💰 Доход в USD/день</div>
                <div className="text-2xl font-bold text-green-700">${(dailyLTCProduction * ltcPriceNow + dailyDOGEProduction * dogePriceNow).toFixed(2)}</div>
                <div className="text-xs text-gray-500">
                  LTC: ${(dailyLTCProduction * ltcPriceNow).toFixed(2)} + DOGE: ${(dailyDOGEProduction * dogePriceNow).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Токен H2C-LTC */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-cyan-500">💎</span> Токен HASH2CASH-LTC (H2C-LTC)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Средняя себестоимость
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${costPerMH.toFixed(4)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  За 1 MH/s
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = ${miner.price} ÷ {miner.hashrate.toLocaleString()} MH/s
                </div>
              </div>
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-lg border-2 border-cyan-300">
                <label className="block text-sm font-semibold text-cyan-700 mb-2">
                  💰 Цена 1 H2C-LTC
                </label>
                <div className="text-3xl font-bold text-cyan-700 mb-1">
                  ${tokenPrice.toFixed(4)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  1 H2C-LTC = 1 MH/s в пуле
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = ${costPerMH.toFixed(4)} × (1 + {marginPercent}%)
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
                  Прибыль: ${(tokenPrice - costPerMH).toFixed(4)}/MH
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = (${tokenPrice.toFixed(4)} - ${costPerMH.toFixed(4)}) ÷ ${costPerMH.toFixed(4)} × 100%
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
                  ${avgAnnualRevenue.toFixed(2)}/год на 1 H2C-LTC
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  = (${avgAnnualRevenue.toFixed(2)} ÷ ${tokenPrice.toFixed(4)}) × 100%
                </div>
              </div>
            </div>
          </div>

          {/* Формулы расчёта ROI */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📐 Формулы и расчёты ROI</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ROI компании */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300">
                <h3 className="text-xl font-bold text-purple-900 mb-4">
                  🏢 ROI компании: <span className="text-3xl text-purple-700">{poolCalculation.companyROI.toFixed(1)}%</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">1️⃣ Инвестиции в оборудование:</div>
                    <div className="font-mono text-xs bg-blue-50 p-2 rounded mb-1">
                      = {minerCount} асиков × ${miner.price.toLocaleString()}
                    </div>
                    <div className="text-xl font-bold">
                      = ${poolCalculation.totalInvestment.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">2️⃣ Доход от продажи токенов (год 1):</div>
                    <div className="font-mono text-xs bg-green-50 p-2 rounded mb-1">
                      = {totalPoolMH.toLocaleString()} токенов × (${tokenPrice.toFixed(4)} - ${costPerMH.toFixed(4)})
                    </div>
                    <div className="text-xl font-bold">
                      = ${poolCalculation.tokenSalesRevenue.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">3️⃣ Доход от ЭЭ (ежегодно):</div>
                    <div className="font-mono text-xs bg-green-50 p-2 rounded mb-1">
                      = {totalPoolMH.toLocaleString()} MH × (${clientCostPerKwh.toFixed(6)} - ${companyCostPerKwh.toFixed(6)}) × 365 дней
                    </div>
                    <div className="text-xl font-bold">
                      = ${poolCalculation.energyProfitPerYear.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">4️⃣ Общий доход (год 1):</div>
                    <div className="font-mono text-xs bg-green-50 p-2 rounded mb-1">
                      = ${poolCalculation.tokenSalesRevenue.toLocaleString()} + ${poolCalculation.energyProfitPerYear.toLocaleString()}
                    </div>
                    <div className="text-xl font-bold">
                      = ${poolCalculation.totalRevenueYear1.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <div className="font-semibold mb-1">5️⃣ ROI компании:</div>
                    <div className="font-mono text-xs bg-white p-2 rounded mb-1">
                      = (${poolCalculation.totalRevenueYear1.toLocaleString()} ÷ ${poolCalculation.totalInvestment.toLocaleString()}) × 100%
                    </div>
                    <div className="text-2xl font-bold text-purple-700">
                      = {poolCalculation.companyROI.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI инвестора */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  👤 ROI инвестора: <span className="text-3xl text-blue-700">{poolCalculation.investorROI.toFixed(1)}%</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">1️⃣ Доход от майнинга LTC/день:</div>
                    <div className="font-mono text-xs bg-blue-50 p-2 rounded mb-1">
                      = {ltcPerMHPerDay.toFixed(7)} LTC × ${ltcPriceNow.toFixed(2)}
                    </div>
                    <div className="text-xl font-bold">
                      = ${(ltcPerMHPerDay * ltcPriceNow).toFixed(6)}/день
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">2️⃣ Доход от майнинга DOGE/день:</div>
                    <div className="font-mono text-xs bg-orange-50 p-2 rounded mb-1">
                      = {dogePerMHPerDay.toFixed(8)} DOGE × ${dogePriceNow.toFixed(4)}
                    </div>
                    <div className="text-xl font-bold">
                      = ${(dogePerMHPerDay * dogePriceNow).toFixed(6)}/день
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">3️⃣ Общий доход от майнинга:</div>
                    <div className="font-mono text-xs bg-green-50 p-2 rounded mb-1">
                      = ${(ltcPerMHPerDay * ltcPriceNow).toFixed(6)} + ${(dogePerMHPerDay * dogePriceNow).toFixed(6)}
                    </div>
                    <div className="text-xl font-bold">
                      = ${miningRevenuePerMH.toFixed(6)}/день
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">4️⃣ Затраты на ЭЭ:</div>
                    <div className="font-mono text-xs bg-red-50 p-2 rounded mb-1">
                      = {avgEnergyPerMH.toFixed(6)} кВт × ({clientCostEE}₽ ÷ {usdtRate})
                    </div>
                    <div className="text-xl font-bold">
                      = ${clientCostPerKwh.toFixed(6)}/день
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-semibold mb-1">5️⃣ Чистый доход:</div>
                    <div className="font-mono text-xs bg-green-50 p-2 rounded mb-1">
                      = ${miningRevenuePerMH.toFixed(6)} - ${clientCostPerKwh.toFixed(6)}
                    </div>
                    <div className="text-xl font-bold">
                      = ${poolCalculation.investorDailyRevenue.toFixed(6)}/день
                    </div>
                    <div className="text-lg font-bold text-green-700 mt-1">
                      = ${poolCalculation.investorAnnualRevenue.toFixed(2)}/год
                    </div>
                  </div>
                  
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="font-semibold mb-1">6️⃣ ROI инвестора:</div>
                    <div className="font-mono text-xs bg-white p-2 rounded mb-1">
                      = (${poolCalculation.investorAnnualRevenue.toFixed(2)} ÷ ${tokenPrice.toFixed(4)}) × 100%
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      = {poolCalculation.investorROI.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Детальный расчет потребления */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h4 className="font-bold text-blue-900 mb-3 text-xl">⚡ Детальный расчет потребления пула:</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="bg-blue-50 p-3 rounded border">
                <div className="font-semibold text-gray-800 mb-2">Потребление асиков:</div>
                <div className="ml-4 space-y-1">
                  <div>• Antminer L9: {minerCount} шт × {miner.power}W = <strong>{totalPowerWatts.toLocaleString()}W</strong></div>
                  <div className="border-t pt-1 font-semibold text-lg">ИТОГО: <strong>{totalPowerWatts.toLocaleString()}W</strong> = <strong>{totalPowerMW.toFixed(2)} МВт</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Критический анализ сложности сети */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h4 className="font-bold text-red-900 mb-3 text-2xl">🚨 КРИТИЧЕСКИ ВАЖНО: Рост сложности сети Litecoin</h4>
            <div className="text-sm text-gray-700 space-y-3">
              <div className="bg-red-50 p-4 rounded border-2 border-red-200">
                <div className="font-semibold text-red-800 mb-2 text-lg">📈 Сложность сети растет быстро:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Текущий рост:</strong> {difficultyGrowth}% в год</div>
                  <div>• <strong>Это означает:</strong> каждый год доходность майнинга падает на {difficultyGrowth}%</div>
                  <div>• <strong>Через 3 года:</strong> доходность упадет до {((1 - difficultyGrowth/100) ** 2 * 100).toFixed(1)}% от начальной</div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded border-2 border-orange-200">
                <div className="font-semibold text-orange-800 mb-2 text-lg">💰 Что это означает для доходности:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Год 1:</strong> 100% от текущей доходности = {poolCalculation.investorROI.toFixed(1)}%</div>
                  <div>• <strong>Год 2:</strong> {((1 - difficultyGrowth/100) * 100).toFixed(1)}% от текущей = {(poolCalculation.investorROI * (1 - difficultyGrowth/100)).toFixed(1)}%</div>
                  <div>• <strong>Год 3:</strong> {(((1 - difficultyGrowth/100) ** 2) * 100).toFixed(1)}% от текущей = {(poolCalculation.investorROI * ((1 - difficultyGrowth/100) ** 2)).toFixed(1)}%</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded border-2 border-yellow-200">
                <div className="font-semibold text-yellow-800 mb-2 text-lg">🎯 Необходимая динамика курсов для сохранения доходности:</div>
                <div className="ml-4 space-y-2">
                  <div className="bg-white p-2 rounded">
                    <div className="font-bold">LTC должен расти на {difficultyGrowth}% в год:</div>
                    <div>• Год 1: до ${(ltcPriceNow * (1 + difficultyGrowth/100)).toFixed(2)}</div>
                    <div>• Год 2: до ${(ltcPriceNow * ((1 + difficultyGrowth/100) ** 2)).toFixed(2)}</div>
                    <div>• Год 3: до ${(ltcPriceNow * ((1 + difficultyGrowth/100) ** 3)).toFixed(2)}</div>
                  </div>
                  <div className="text-xs text-gray-600 italic">
                    * DOGE обычно растет вместе с LTC из-за merged mining
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded border-2 border-red-300">
                <div className="font-semibold text-red-800 mb-2 text-lg">⚠️ Выводы:</div>
                <div className="ml-4 space-y-1">
                  <div>• <strong>Без роста курса LTC:</strong> майнинг станет убыточным через 2-3 года</div>
                  <div>• <strong>Для окупаемости:</strong> LTC должен расти минимум на {difficultyGrowth}% в год</div>
                  <div>• <strong>Риск:</strong> если курс LTC не растет, инвестор теряет деньги</div>
                  <div>• <strong>Рекомендация:</strong> инвестировать только при уверенности в росте LTC</div>
                </div>
              </div>
            </div>
          </div>

          {/* Показатели пула */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Показатели майнинг-пула</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4">🏢 Параметры пула</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Мощность:</span>
                    <span className="font-bold">{poolCalculation.totalMH.toLocaleString()} MH/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Токенов:</span>
                    <span className="font-bold">{poolCalculation.tokens.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Инвестиции:</span>
                    <span className="font-bold text-red-600">
                      ${poolCalculation.totalInvestment.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl border-2 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-4">💰 Доходы компании</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">От токенов:</span>
                    <span className="font-bold text-green-600">
                      ${poolCalculation.tokenSalesRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">От ЭЭ (год):</span>
                    <span className="font-bold text-green-600">
                      ${poolCalculation.energyProfitPerYear.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 font-semibold">Итого год 1:</span>
                    <span className="font-bold text-green-700 text-lg">
                      ${poolCalculation.totalRevenueYear1.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 font-semibold">ROI компании:</span>
                    <span className="font-bold text-blue-700 text-xl">
                      {poolCalculation.companyROI.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-4">👤 Доходы инвестора</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Доход (день):</span>
                    <span className="font-bold">${poolCalculation.investorDailyRevenue.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Доход (год):</span>
                    <span className="font-bold">${poolCalculation.investorAnnualRevenue.toFixed(2)}</span>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-purple-700 font-semibold mb-2">ROI инвестора: {poolCalculation.investorROI.toFixed(2)}%</div>
                    
                    {/* Ползунок с долями */}
                    <div className="relative">
                      <div className="h-6 bg-gray-200 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-xs font-semibold"
                          style={{width: `${(clientCostPerKwh * 365 / (poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365)) * 100}%`}}
                        >
                          ЭЭ: {((clientCostPerKwh * 365 / (poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365)) * 100).toFixed(1)}%
                        </div>
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-xs font-semibold absolute top-0"
                          style={{
                            left: `${(clientCostPerKwh * 365 / (poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365)) * 100}%`,
                            width: `${100 - (clientCostPerKwh * 365 / (poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365)) * 100}%`
                          }}
                        >
                          Чистый: {(100 - (clientCostPerKwh * 365 / (poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Грязный: ${(poolCalculation.investorAnnualRevenue + clientCostPerKwh * 365).toFixed(2)} | 
                        ЭЭ: ${(clientCostPerKwh * 365).toFixed(2)} | 
                        Чистый: ${poolCalculation.investorAnnualRevenue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between bg-orange-50 p-2 rounded">
                    <span className="text-orange-700 font-semibold">Окупаемость:</span>
                    <span className="font-bold text-orange-700 text-lg">
                      {poolCalculation.paybackYears.toFixed(2)} лет
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* График */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">📈 Динамика доходов и расходов (5 лет)</h2>
            
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClientRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompanyRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorElectricityCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                  dataKey="clientRevenue" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorClientRevenue)" 
                  name="Доходы клиента от майнинга"
                />
                <Area 
                  type="monotone" 
                  dataKey="companyRevenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorCompanyRevenue)" 
                  name="Доходы компании"
                />
                <Area 
                  type="monotone" 
                  dataKey="clientElectricityCost" 
                  stroke="#ef4444" 
                  fillOpacity={1} 
                  fill="url(#colorElectricityCost)" 
                  name="Расходы клиента на ЭЭ"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Детали парка */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Детали парка оборудования</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Модель</th>
                    <th className="p-3 text-center">Мощность (MH/s)</th>
                    <th className="p-3 text-center">Количество</th>
                    <th className="p-3 text-center">Потребление (кВт)</th>
                    <th className="p-3 text-center">Себестоимость/MH</th>
                    <th className="p-3 text-center">Эффективность</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="bg-cyan-50 hover:bg-cyan-100">
                    <td className="p-3 font-semibold">{miner.name}</td>
                    <td className="p-3 text-center">{miner.hashrate.toLocaleString()} MH/s</td>
                    <td className="p-3 text-center">{minerCount} шт</td>
                    <td className="p-3 text-center">{(minerCount * miner.power / 1000).toFixed(1)} кВт</td>
                    <td className="p-3 text-center">${costPerMH.toFixed(4)}</td>
                    <td className="p-3 text-center">{miner.efficiency} Вт/MH</td>
                  </tr>
                  <tr className="bg-gray-100 font-bold">
                    <td className="p-3">ИТОГО</td>
                    <td className="p-3 text-center">{totalPoolMH.toLocaleString()} MH/s</td>
                    <td className="p-3 text-center">{minerCount} шт</td>
                    <td className="p-3 text-center">{(totalPowerMW * 1000).toFixed(1)} кВт</td>
                    <td className="p-3 text-center">${costPerMH.toFixed(4)}</td>
                    <td className="p-3 text-center">{miner.efficiency} Вт/MH</td>
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
          to="/" 
          className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-orange-600 hover:to-yellow-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">₿</span>
          <span>Bitcoin Pool</span>
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

export default LitecoinApp

