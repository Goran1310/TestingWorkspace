using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using System.IO;
using Newtonsoft.Json;
using ClosedXML.Excel;
using API_endpoint_FA;

class Program
{
    public static async Task Main(string[] args)
    {
        var allTransactions = new List<Transaction>();
        int maxPages = 3; // Control how many pages to fetch
        int page = 1;
        int limit = 50;

        using var client = new HttpClient();

        while (page <= maxPages)
        {
            try
            {
                var url = $"https://prod-shareholders-ws.finansavisen.no/transaction?&page={page}&limit={limit}";
                var response = await client.GetStringAsync(url);
                var result = JsonConvert.DeserializeObject<ApiResponse>(response);

                if (result?.Data != null && result.Data.Count > 0)
                {
                    allTransactions.AddRange(result.Data);
                    page++;
                }
                else
                {
                    break; // No more data, exit loop
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"API fetch or deserialization failed: {ex.Message}");
                break;
            }
        }

        // Sort transactions by TransactionDate descending
        allTransactions = allTransactions
            .OrderBy(t => t.TransactionDate)
            .ToList();

        Console.WriteLine($"Fetched {allTransactions.Count} transactions.");

        // Export to Excel (wrap in Task.Run to avoid blocking)
        await Task.Run(() =>
        {
            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Transactions");

            // Header
            worksheet.Cell(1, 1).Value = "Transaction Id";
            worksheet.Cell(1, 2).Value = "Investor Name";
            worksheet.Cell(1, 3).Value = "Stock Ticker";
            worksheet.Cell(1, 4).Value = "Stock Name";
            worksheet.Cell(1, 5).Value = "Buyer Company";
            worksheet.Cell(1, 6).Value = "Transaction Date";
            worksheet.Cell(1, 7).Value = "Number of Stocks";
            worksheet.Cell(1, 8).Value = "Value of Stocks";
            worksheet.Cell(1, 9).Value = "Calculation Price";
            worksheet.Cell(1, 10).Value = "New Ownership %";
            worksheet.Cell(1, 11).Value = "Stock Amount Owned";

            // Data rows
            for (int i = 0; i < allTransactions.Count; i++)
            {
                var t = allTransactions[i];
                worksheet.Cell(i + 2, 1).Value = t.Id;
                worksheet.Cell(i + 2, 2).Value = t.Investor?.Name;
                worksheet.Cell(i + 2, 3).Value = t.Stock?.Ticker;
                worksheet.Cell(i + 2, 4).Value = t.Stock?.Name;
                worksheet.Cell(i + 2, 5).Value = t.BuyerCompany;
                worksheet.Cell(i + 2, 6).Value = t.TransactionDate.ToString("yyyy-MM-dd");
                worksheet.Cell(i + 2, 7).Value = t.NumberOfStocksInTransactions;
                worksheet.Cell(i + 2, 8).Value = t.ValueOfStocks;
                worksheet.Cell(i + 2, 9).Value = t.CalculationPrice;
                worksheet.Cell(i + 2, 10).Value = t.NewTotalOwnershipPct;
                worksheet.Cell(i + 2, 11).Value = t.StockAmountOwned;
            }

            try
            {
                // Generate a unique filename with timestamp
                string timestamp = $"transaction - {DateTime.Now:yyyy-MM-dd'T'HHmmss.fff}";
                string filePath = $@"C:\Users\goran.lovincic\Downloads\Transactions_{timestamp}.xlsx";

                string? directory = Path.GetDirectoryName(path: filePath);
                if (string.IsNullOrWhiteSpace(directory))
                {
                    throw new InvalidOperationException($"Could not determine output directory for path: {filePath}");
                }

                if (!Directory.Exists(directory))
                {
                    Directory.CreateDirectory(path: directory);
                }

                workbook.SaveAs(filePath);
                Console.WriteLine($"Exported to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Export failed: {ex.Message}");
            }
        });
    }
}

namespace API_endpoint_FA
{
    public record Transaction(int Id, Investor Investor, Stock Stock, string BuyerCompany, int NumberOfStocksInTransactions, double RelativeChangeInStockHoldingsPct, decimal ValueOfStocks, double NewTotalOwnershipPct, DateTime TransactionDate, decimal StockValueChange, decimal CalculationPrice, int StockAmountOwned);

    public record Investor(int Id, string Name, string Avatar);

    public class ApiResponse
    {
        public required List<Transaction> Data { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
    }

    public class Stock(int id, string ticker, string name, string fullname, string isin, string insref, string instrumentLogo)
    {
        public int Id { get; set; } = id;
        public string Ticker { get; set; } = ticker;
        public string Name { get; set; } = name;
        public string Fullname { get; set; } = fullname;
        public string Isin { get; set; } = isin;
        public string Insref { get; set; } = insref;
        public string InstrumentLogo { get; set; } = instrumentLogo;
    }
}