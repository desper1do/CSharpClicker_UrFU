using System.Globalization;

namespace CSharpClicker.Helpers;

public static class FormatHelper
{
    public static string ToCompact(this long number)
    {
        if (number < 1000)
            return number.ToString();

        // K (Thousands) - от 1,000 до 999,999
        if (number < 1_000_000)
            return FormatValue(number, 1_000, "K");

        // M (Millions) - от 1,000,000 до 999,999,999
        if (number < 1_000_000_000)
            return FormatValue(number, 1_000_000, "M");

        // B (Billions) - от 1,000,000,000 до 999,999,999,999
        if (number < 1_000_000_000_000)
            return FormatValue(number, 1_000_000_000, "B");

        // T (Trillions)
        return FormatValue(number, 1_000_000_000_000, "T");
    }

    private static string FormatValue(long number, double divisor, string suffix)
    {
        double value = number / divisor;

        // Если число целое (например 290.0), убираем десятичную часть
        // Если дробное (1.5), оставляем 1-2 знака
        if (value >= 100)
            return value.ToString("0", CultureInfo.InvariantCulture) + suffix; // 290M

        return value.ToString("0.##", CultureInfo.InvariantCulture) + suffix; // 1.5K или 10.5M
    }
}