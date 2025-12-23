using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Linq;

namespace Perigon.Tests.SharedProduction
{
    /// <summary>
    /// Test Suite: GRID-8280 - Shared Production | Hide Active Button for Disconnected Shared Productions
    /// Scenario 1: Disconnected Shared Production - Button Disabling
    /// </summary>
    [TestFixture]
    [Category("SharedProduction")]
    [Category("GRID-8280")]
    [Category("UITests")]
    public class DisconnectedSharedProductionButtonTests : BaseUITest
    {
        private IWebDriver _driver;
        private WebDriverWait _wait;
        private const int DEFAULT_TIMEOUT = 10;

        #region Setup and Teardown

        [SetUp]
        public void SetUp()
        {
            // Initialize WebDriver (Chrome/Edge/Firefox)
            _driver = InitializeDriver();
            _wait = new WebDriverWait(_driver, TimeSpan.FromSeconds(DEFAULT_TIMEOUT));

            // Login to Perigon
            LoginToPerigon();

            // Navigate to Metering Point module
            NavigateToMeteringPointModule();
        }

        [TearDown]
        public void TearDown()
        {
            // Capture screenshot on failure
            if (TestContext.CurrentContext.Result.Outcome.Status == NUnit.Framework.Interfaces.TestStatus.Failed)
            {
                CaptureScreenshot($"GRID-8280_{TestContext.CurrentContext.Test.Name}");
            }

            // Close browser
            _driver?.Quit();
            _driver?.Dispose();
        }

        #endregion

        #region Test Cases

        /// <summary>
        /// TC-8280-001: Verify Edit Shared Production Button is Disabled
        /// 
        /// Objective: Verify that the "Edit Shared Production" button is disabled 
        /// when Elhub status is Disconnected (value 3)
        /// 
        /// Prerequisites:
        /// - User has access to Perigon Metering Point module
        /// - Shared production exists with Elhub status = 3 (Disconnected)
        /// - User has appropriate permissions to view shared productions
        /// </summary>
        [Test]
        [Description("Verify Edit Shared Production Button is Disabled when Elhub status is Disconnected")]
        [Property("TestCaseId", "TC-8280-001")]
        [Property("Priority", "High")]
        [Property("Scenario", "Disconnected Button Disabling")]
        public void TC_8280_001_VerifyEditSharedProductionButtonDisabled()
        {
            // Arrange
            Console.WriteLine("TC-8280-001: Verify Edit Shared Production Button is Disabled");
            Console.WriteLine("Step 1: Navigate to Metering Point module");
            
            // Step 2: Open Shared Production view
            Console.WriteLine("Step 2: Open Shared Production view");
            NavigateToSharedProductionView();
            
            // Step 3: Locate a shared production with Elhub status = 3 (Disconnected)
            Console.WriteLine("Step 3: Locate a shared production with Elhub status = 3 (Disconnected)");
            var disconnectedSharedProduction = FindSharedProductionByElhubStatus(3);
            Assert.IsNotNull(disconnectedSharedProduction, 
                "No shared production found with Elhub status = 3 (Disconnected)");
            
            // Click to open the shared production details
            disconnectedSharedProduction.Click();
            WaitForPageLoad();

            // Step 4: Observe the "Edit Shared Production" button state
            Console.WriteLine("Step 4: Observe the 'Edit Shared Production' button state");
            var editButton = FindElement(By.Id("editSharedProductionButton"), 
                                        By.XPath("//button[contains(text(), 'Edit Shared Production')]"),
                                        By.CssSelector("button[data-action='edit-shared-production']"));
            
            Assert.IsNotNull(editButton, "Edit Shared Production button not found");

            // Act & Assert - Expected Results
            Console.WriteLine("Step 5: Verify button is visually disabled and non-clickable");
            
            // Expected Result 1: Button appears visually disabled (grayed out)
            bool isDisabled = IsButtonDisabled(editButton);
            Assert.IsTrue(isDisabled, 
                "FAILED: Edit Shared Production button should be disabled (grayed out)");
            Console.WriteLine("✓ PASSED: Button appears visually disabled");

            // Expected Result 2: Button is non-clickable
            bool isClickable = IsElementClickable(editButton);
            Assert.IsFalse(isClickable, 
                "FAILED: Edit Shared Production button should not be clickable");
            Console.WriteLine("✓ PASSED: Button is non-clickable");

            // Expected Result 3: No edit dialog opens when attempting to click
            string currentUrl = _driver.Url;
            int dialogCountBefore = GetOpenDialogCount();
            
            TryClickElement(editButton);
            System.Threading.Thread.Sleep(1000); // Wait for any potential dialog
            
            int dialogCountAfter = GetOpenDialogCount();
            string urlAfter = _driver.Url;
            
            Assert.AreEqual(dialogCountBefore, dialogCountAfter, 
                "FAILED: No dialog should open when clicking disabled button");
            Assert.AreEqual(currentUrl, urlAfter, 
                "FAILED: URL should not change when clicking disabled button");
            Console.WriteLine("✓ PASSED: No edit dialog opened");

            Console.WriteLine("TC-8280-001: TEST PASSED - All assertions successful");
        }

        /// <summary>
        /// TC-8280-002: Verify Edit Members Button is Disabled
        /// 
        /// Objective: Verify that the "Edit Members" button is disabled 
        /// when Elhub status is Disconnected (value 3)
        /// 
        /// Prerequisites:
        /// - User has access to Perigon Metering Point module
        /// - Shared production exists with Elhub status = 3 (Disconnected)
        /// - Shared production has members configured
        /// </summary>
        [Test]
        [Description("Verify Edit Members Button is Disabled when Elhub status is Disconnected")]
        [Property("TestCaseId", "TC-8280-002")]
        [Property("Priority", "High")]
        [Property("Scenario", "Disconnected Button Disabling")]
        public void TC_8280_002_VerifyEditMembersButtonDisabled()
        {
            // Arrange
            Console.WriteLine("TC-8280-002: Verify Edit Members Button is Disabled");
            
            // Step 1: Navigate to a disconnected shared production (Elhub status = 3)
            Console.WriteLine("Step 1: Navigate to disconnected shared production");
            NavigateToSharedProductionView();
            var disconnectedSharedProduction = FindSharedProductionByElhubStatus(3);
            Assert.IsNotNull(disconnectedSharedProduction, 
                "No shared production found with Elhub status = 3");
            
            disconnectedSharedProduction.Click();
            WaitForPageLoad();

            // Step 2: Locate the "Edit Members" action button
            Console.WriteLine("Step 2: Locate the 'Edit Members' action button");
            var editMembersButton = FindElement(
                By.Id("editMembersButton"),
                By.XPath("//button[contains(text(), 'Edit Members')]"),
                By.CssSelector("button[data-action='edit-members']"),
                By.XPath("//button[contains(@class, 'edit-members')]"));
            
            Assert.IsNotNull(editMembersButton, "Edit Members button not found");

            // Step 3: Observe the button state
            Console.WriteLine("Step 3: Observe the button state");

            // Act & Assert - Expected Results
            Console.WriteLine("Step 4: Verify button is disabled and non-clickable");
            
            // Expected Result 1: Button is visually disabled
            bool isDisabled = IsButtonDisabled(editMembersButton);
            Assert.IsTrue(isDisabled, 
                "FAILED: Edit Members button should be visually disabled");
            Console.WriteLine("✓ PASSED: Button is visually disabled");

            // Expected Result 2: Button is non-clickable
            bool isClickable = IsElementClickable(editMembersButton);
            Assert.IsFalse(isClickable, 
                "FAILED: Edit Members button should not be clickable");
            Console.WriteLine("✓ PASSED: Button is non-clickable");

            // Expected Result 3: Members edit interface does not open
            int dialogCountBefore = GetOpenDialogCount();
            TryClickElement(editMembersButton);
            System.Threading.Thread.Sleep(1000);
            
            int dialogCountAfter = GetOpenDialogCount();
            Assert.AreEqual(dialogCountBefore, dialogCountAfter, 
                "FAILED: Members edit interface should not open");
            Console.WriteLine("✓ PASSED: Members edit interface did not open");

            // Additional verification: Check for members grid/panel
            var membersEditPanel = FindElements(
                By.Id("membersEditPanel"),
                By.ClassName("members-edit-panel"),
                By.XPath("//*[contains(@class, 'members-edit')]"));
            
            Assert.IsTrue(membersEditPanel.Count == 0 || !membersEditPanel.First().Displayed,
                "FAILED: Members edit panel should not be visible");
            Console.WriteLine("✓ PASSED: No members edit panel visible");

            Console.WriteLine("TC-8280-002: TEST PASSED - All assertions successful");
        }

        /// <summary>
        /// TC-8280-003: Verify Activate Button is Disabled
        /// 
        /// Objective: Verify that the "Activate" button is disabled 
        /// when Elhub status is Disconnected (value 3)
        /// 
        /// Prerequisites:
        /// - User has access to Perigon Metering Point module
        /// - Shared production exists with Elhub status = 3 (Disconnected)
        /// - User has permissions to activate shared productions
        /// </summary>
        [Test]
        [Description("Verify Activate Button is Disabled when Elhub status is Disconnected")]
        [Property("TestCaseId", "TC-8280-003")]
        [Property("Priority", "High")]
        [Property("Scenario", "Disconnected Button Disabling")]
        public void TC_8280_003_VerifyActivateButtonDisabled()
        {
            // Arrange
            Console.WriteLine("TC-8280-003: Verify Activate Button is Disabled");
            
            // Step 1: Navigate to a disconnected shared production (Elhub status = 3)
            Console.WriteLine("Step 1: Navigate to disconnected shared production");
            NavigateToSharedProductionView();
            var disconnectedSharedProduction = FindSharedProductionByElhubStatus(3);
            Assert.IsNotNull(disconnectedSharedProduction, 
                "No shared production found with Elhub status = 3");
            
            disconnectedSharedProduction.Click();
            WaitForPageLoad();

            // Step 2: Locate the "Activate" action button
            Console.WriteLine("Step 2: Locate the 'Activate' action button");
            var activateButton = FindElement(
                By.Id("activateButton"),
                By.XPath("//button[contains(text(), 'Activate')]"),
                By.CssSelector("button[data-action='activate']"),
                By.XPath("//button[contains(@class, 'activate-button')]"),
                By.XPath("//div[@class='action-buttons']//button[contains(text(), 'Activate')]"));
            
            Assert.IsNotNull(activateButton, "Activate button not found");

            // Step 3: Observe the button state
            Console.WriteLine("Step 3: Observe the button state");

            // Act & Assert - Expected Results
            Console.WriteLine("Step 4: Verify button is disabled and activation does not occur");
            
            // Expected Result 1: Button is visually disabled
            bool isDisabled = IsButtonDisabled(activateButton);
            Assert.IsTrue(isDisabled, 
                "FAILED: Activate button should be visually disabled");
            Console.WriteLine("✓ PASSED: Button is visually disabled");

            // Expected Result 2: Button is non-clickable
            bool isClickable = IsElementClickable(activateButton);
            Assert.IsFalse(isClickable, 
                "FAILED: Activate button should not be clickable");
            Console.WriteLine("✓ PASSED: Button is non-clickable");

            // Expected Result 3: No activation occurs
            // Get current status before attempting click
            string statusBefore = GetSharedProductionStatus();
            Console.WriteLine($"Status before click attempt: {statusBefore}");
            
            TryClickElement(activateButton);
            System.Threading.Thread.Sleep(2000); // Wait for any potential activation process
            
            string statusAfter = GetSharedProductionStatus();
            Console.WriteLine($"Status after click attempt: {statusAfter}");
            
            Assert.AreEqual(statusBefore, statusAfter, 
                "FAILED: Status should not change when clicking disabled Activate button");
            Console.WriteLine("✓ PASSED: No activation occurred");

            // Verify no success/confirmation messages appeared
            var successMessages = FindElements(
                By.ClassName("success-message"),
                By.ClassName("confirmation-dialog"),
                By.XPath("//*[contains(@class, 'alert-success')]"));
            
            Assert.AreEqual(0, successMessages.Count, 
                "FAILED: No success message should appear");
            Console.WriteLine("✓ PASSED: No success/confirmation messages");

            Console.WriteLine("TC-8280-003: TEST PASSED - All assertions successful");
        }

        #endregion

        #region Helper Methods

        /// <summary>
        /// Navigate to Metering Point module in Perigon
        /// </summary>
        private void NavigateToMeteringPointModule()
        {
            Console.WriteLine("Navigating to Metering Point module...");
            var meteringPointMenu = _wait.Until(driver => 
                driver.FindElement(By.XPath("//a[contains(text(), 'Metering Point')]")));
            meteringPointMenu.Click();
            WaitForPageLoad();
        }

        /// <summary>
        /// Navigate to Shared Production view
        /// </summary>
        private void NavigateToSharedProductionView()
        {
            Console.WriteLine("Navigating to Shared Production view...");
            var sharedProductionLink = _wait.Until(driver => 
                driver.FindElement(By.XPath("//a[contains(text(), 'Shared Production')]")));
            sharedProductionLink.Click();
            WaitForPageLoad();
        }

        /// <summary>
        /// Find a shared production by Elhub status value
        /// </summary>
        /// <param name="elhubStatusValue">Elhub status value (e.g., 3 for Disconnected)</param>
        /// <returns>WebElement representing the shared production row</returns>
        private IWebElement FindSharedProductionByElhubStatus(int elhubStatusValue)
        {
            Console.WriteLine($"Searching for shared production with Elhub status = {elhubStatusValue}...");
            
            // Wait for table to load
            _wait.Until(driver => driver.FindElement(By.ClassName("shared-production-grid")));
            
            // Find row with matching status
            var rows = _driver.FindElements(By.XPath("//table[@class='shared-production-grid']//tr"));
            
            foreach (var row in rows)
            {
                var statusCell = row.FindElements(By.XPath(".//td[@data-field='elhubStatus']"));
                if (statusCell.Any())
                {
                    var statusValue = statusCell.First().GetAttribute("data-value");
                    if (statusValue == elhubStatusValue.ToString())
                    {
                        Console.WriteLine($"Found shared production with Elhub status {elhubStatusValue}");
                        return row;
                    }
                }
            }
            
            return null;
        }

        /// <summary>
        /// Check if a button is disabled (via disabled attribute or CSS classes)
        /// </summary>
        private bool IsButtonDisabled(IWebElement button)
        {
            // Check disabled attribute
            string disabledAttr = button.GetAttribute("disabled");
            if (disabledAttr != null && disabledAttr.ToLower() == "true")
                return true;

            // Check aria-disabled attribute
            string ariaDisabled = button.GetAttribute("aria-disabled");
            if (ariaDisabled != null && ariaDisabled.ToLower() == "true")
                return true;

            // Check CSS classes
            string classAttr = button.GetAttribute("class");
            if (classAttr != null && (classAttr.Contains("disabled") || classAttr.Contains("btn-disabled")))
                return true;

            // Check if enabled attribute is false
            bool isEnabled = button.Enabled;
            return !isEnabled;
        }

        /// <summary>
        /// Check if an element is clickable
        /// </summary>
        private bool IsElementClickable(IWebElement element)
        {
            try
            {
                var clickable = _wait.Until(driver => 
                {
                    try
                    {
                        return element.Displayed && element.Enabled;
                    }
                    catch
                    {
                        return false;
                    }
                });
                return clickable;
            }
            catch (WebDriverTimeoutException)
            {
                return false;
            }
        }

        /// <summary>
        /// Attempt to click an element (used for testing disabled elements)
        /// </summary>
        private void TryClickElement(IWebElement element)
        {
            try
            {
                element.Click();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Click blocked (expected for disabled element): {ex.Message}");
            }
        }

        /// <summary>
        /// Get count of open dialogs/modals
        /// </summary>
        private int GetOpenDialogCount()
        {
            var dialogs = _driver.FindElements(By.CssSelector(".modal.show, .dialog.open, [role='dialog'][aria-hidden='false']"));
            return dialogs.Count(d => d.Displayed);
        }

        /// <summary>
        /// Get the current status of the shared production
        /// </summary>
        private string GetSharedProductionStatus()
        {
            var statusElement = FindElement(
                By.Id("sharedProductionStatus"),
                By.CssSelector(".status-value"),
                By.XPath("//*[@data-field='status']"));
            
            return statusElement?.Text ?? "Unknown";
        }

        /// <summary>
        /// Find an element using multiple locator strategies
        /// </summary>
        private IWebElement FindElement(params By[] locators)
        {
            foreach (var locator in locators)
            {
                try
                {
                    var element = _driver.FindElement(locator);
                    if (element != null)
                        return element;
                }
                catch (NoSuchElementException)
                {
                    continue;
                }
            }
            return null;
        }

        /// <summary>
        /// Find elements using multiple locator strategies
        /// </summary>
        private System.Collections.ObjectModel.ReadOnlyCollection<IWebElement> FindElements(params By[] locators)
        {
            foreach (var locator in locators)
            {
                try
                {
                    var elements = _driver.FindElements(locator);
                    if (elements.Any())
                        return elements;
                }
                catch (NoSuchElementException)
                {
                    continue;
                }
            }
            return new System.Collections.ObjectModel.ReadOnlyCollection<IWebElement>(new IWebElement[0]);
        }

        /// <summary>
        /// Wait for page to load completely
        /// </summary>
        private void WaitForPageLoad()
        {
            _wait.Until(driver => 
                ((IJavaScriptExecutor)driver).ExecuteScript("return document.readyState").Equals("complete"));
            System.Threading.Thread.Sleep(500); // Additional buffer
        }

        /// <summary>
        /// Capture screenshot for failed tests
        /// </summary>
        private void CaptureScreenshot(string testName)
        {
            try
            {
                var screenshot = ((ITakesScreenshot)_driver).GetScreenshot();
                string fileName = $"{testName}_{DateTime.Now:yyyyMMdd_HHmmss}.png";
                string filePath = System.IO.Path.Combine(TestContext.CurrentContext.WorkDirectory, "Screenshots", fileName);
                
                System.IO.Directory.CreateDirectory(System.IO.Path.GetDirectoryName(filePath));
                screenshot.SaveAsFile(filePath);
                
                TestContext.WriteLine($"Screenshot saved: {filePath}");
            }
            catch (Exception ex)
            {
                TestContext.WriteLine($"Failed to capture screenshot: {ex.Message}");
            }
        }

        #endregion
    }
}
