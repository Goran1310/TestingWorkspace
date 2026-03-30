using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ClosedXML.Excel;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace API_endpoint_FA
{
    public static class InvestorExport
    {
        public static void ExportUniqueInvestors(IEnumerable<Transaction> transactions)
        {
            var uniqueInvestors = transactions
                .Select(t => t.Investor)
                .Where(inv => inv != null)
                .DistinctBy(inv => inv.Id)
                .ToList();

            Console.WriteLine($"Fetched {uniqueInvestors.Count} unique investors.");

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Investors");

            // Header
            worksheet.Cell(1, 1).Value = "Investor Id";
            worksheet.Cell(1, 2).Value = "Investor Name";
            worksheet.Cell(1, 3).Value = "Avatar";

            // Data rows
            for (int i = 0; i < uniqueInvestors.Count; i++)
            {
                var inv = uniqueInvestors[i];
                worksheet.Cell(i + 2, 1).Value = inv.Id;
                worksheet.Cell(i + 2, 2).Value = inv.Name;
                worksheet.Cell(i + 2, 3).Value = inv.Avatar;
            }

            try
            {
                string timestamp = $"investors - {DateTime.Now:yyyy-MM-dd'T'HHmmss.fff}";
                string filePath = $@"C:\Users\goran.lovincic\Downloads\Investors_{timestamp}.xlsx";

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
                Console.WriteLine($"Exported investors to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Investor export failed: {ex.Message}");
            }
        }

        public static async Task<List<Investor>> FetchAllInvestorsAsync()
        {
            var allInvestors = new List<Investor>();
            int maxPages = 50;
            int page = 1;
            int limit = 50;

            using var client = new HttpClient();

            while (page <= maxPages)
            {
                var url = $"https://your-api/investor?page={page}&limit={limit}";
                var response = await client.GetStringAsync(url);
                var result = JsonConvert.DeserializeObject<InvestorApiResponse>(response);

                if (result?.Data != null && result.Data.Count > 0)
                {
                    allInvestors.AddRange(result.Data);
                    page++;
                }
                else
                {
                    break;
                }
            }

            return allInvestors.DistinctBy(inv => inv.Id).ToList();
        }
    }

    public class InvestorApiResponse
    {
        public required List<Investor> Data { get; set; }
        public int Page { get; set; }
        public int Limit { get; set; }
        public int Total { get; set; }
    }
}