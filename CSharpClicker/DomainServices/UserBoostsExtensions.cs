using CSharpClicker.Domain;

namespace CSharpClicker.DomainServices;

public static class UserBoostsExtensions
{
    // 0.05 = каждые 20 зданий удваивают эффективность
    private const double QuantitySynergyFactor = 0.05;
    // сколько процентов от дохода в секунду добавляется к клику (5%)
    private const double PassiveToClickRatio = 0.05;

    public static long GetProfitPerClick(this ICollection<UserBoost> userBoosts)
    {
        // 1. базовая сила клика (всегда 1 минимум)
        long baseClick = 1;

        // 2. добавляем силу от "ручных" бустов (кирка, динамит)
        var manualBoostsProfit = userBoosts
            .Where(ub => !ub.Boost.IsAuto)
            .Sum(ub => CalculateTotalProfit(ub.Boost.Profit, ub.Quantity));

        // 3. считаем текущий авто-доход (чтобы добавить процент от него к клику)
        var passiveIncome = userBoosts.GetProfitPerSecond();

        // итого: база + ручные бусты + 5% от авто-дохода
        return (long)(baseClick + manualBoostsProfit + (passiveIncome * PassiveToClickRatio));
    }

    public static long GetProfitPerSecond(this ICollection<UserBoost> userBoosts)
    {
        // считаем доход от авто-бустов с учетом синергии количества
        return (long)userBoosts
            .Where(ub => ub.Boost.IsAuto)
            .Sum(ub => CalculateTotalProfit(ub.Boost.Profit, ub.Quantity));
    }

    /// <summary>
    /// Считает общий доход от буста при заданном количестве
    /// Формула: (Profit * Count) * (1 + Count * 0.05)
    /// </summary>
    private static double CalculateTotalProfit(long baseProfit, int quantity)
    {
        return baseProfit * quantity * (1 + quantity * QuantitySynergyFactor);
    }

    /// <summary>
    /// Считает, сколько дохода добавит покупка СЛЕДУЮЩЕГО (+1) буста.
    /// Это разница между доходом при (N+1) и доходом при N.
    /// </summary>
    public static long CalculateIncomeGain(long baseProfit, int currentQuantity)
    {
        var currentTotal = CalculateTotalProfit(baseProfit, currentQuantity);
        var nextTotal = CalculateTotalProfit(baseProfit, currentQuantity + 1);

        return (long)(nextTotal - currentTotal);
    }
}