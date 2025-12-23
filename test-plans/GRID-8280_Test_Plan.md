# Test Plan: GRID-8280 - Shared Production | Hide Active Button for Disconnected Shared Productions

**Jira Ticket:** GRID-8280  
**Test Ticket:** GRID-8281  
**Module:** Perigon - Metering Point / Shared Production  
**Priority:** Medium  
**Target Release:** 2025-12-DB  
**Test Plan Date:** November 11, 2025  
**Prepared By:** Test Planner Assistant

---

## Executive Summary

This test plan covers the validation of new functionality that prevents editing and activation of shared productions when their Elhub status is "Disconnected" (value 3). The feature adds UI controls to disable action buttons and provides informative hover messages to guide users when shared productions are disconnected in Elhub.

### Key Changes
- Action buttons for editing shared production are disabled when Elhub status = 3 (Disconnected)
- Action buttons for editing members are disabled when disconnected
- Activation button is disabled when disconnected
- Hover info messages guide users to create new shared productions

---

## Test Scope

### In Scope
1. **UI Behavior**
   - Verification of button states (enabled/disabled) based on Elhub status
   - Validation of hover messages on disabled buttons
   - Visual confirmation of disabled button styling

2. **Functional Testing**
   - Shared production edit functionality blocking
   - Member edit functionality blocking
   - Activation functionality blocking
   - Status-based conditional logic

3. **Data Testing**
   - Elhub status value 3 (Disconnected) detection
   - Shared production status transitions
   - Different Elhub status values (non-disconnected states)

4. **Localization**
   - English hover message: "Disconnected in Elhub. A new one needs to be created."
   - Norwegian hover message: "Avsluttet i Elhub. Opprett ny."

### Out of Scope
- Testing of other Elhub status values beyond validation they don't disable buttons
- Shared production creation workflow (separate feature)
- Elhub integration testing
- Performance testing
- Database-level status changes
- Non-Norwegian market implementations

---

## Test Scenarios

### Scenario 1: Disconnected Shared Production - Button Disabling

**Objective:** Verify that action buttons are disabled when Elhub status is Disconnected (value 3)

**Preconditions:**
- User has access to Perigon Metering Point module
- Shared production exists with Elhub status = 3 (Disconnected)
- User has appropriate permissions to view shared productions

**Test Cases:**

#### TC-8280-001: Verify Edit Shared Production Button is Disabled
- **Steps:**
  1. Navigate to Metering Point module
  2. Open Shared Production view
  3. Locate a shared production with Elhub status = 3 (Disconnected)
  4. Observe the "Edit Shared Production" button state
  5. Attempt to click the button
- **Expected Result:** 
  - Button appears visually disabled (grayed out)
  - Button is non-clickable
  - No edit dialog opens

#### TC-8280-002: Verify Edit Members Button is Disabled
- **Steps:**
  1. Navigate to a disconnected shared production (Elhub status = 3)
  2. Locate the "Edit Members" action button
  3. Observe the button state
  4. Attempt to click the button
- **Expected Result:** 
  - Button is visually disabled
  - Button is non-clickable
  - Members edit interface does not open

#### TC-8280-003: Verify Activate Button is Disabled
- **Steps:**
  1. Navigate to a disconnected shared production (Elhub status = 3)
  2. Locate the "Activate" action button
  3. Observe the button state
  4. Attempt to click the button
- **Expected Result:** 
  - Button is visually disabled
  - Button is non-clickable
  - No activation occurs

---

### Scenario 2: Hover Message Validation

**Objective:** Verify that appropriate hover messages appear on disabled buttons

**Preconditions:**
- Shared production with Elhub status = 3 exists
- User interface language settings configured for English/Norwegian

**Test Cases:**

#### TC-8280-004: Verify English Hover Message
- **Steps:**
  1. Set UI language to English
  2. Navigate to disconnected shared production
  3. Hover mouse over disabled "Edit Shared Production" button
  4. Observe the tooltip/info message
- **Expected Result:** 
  - Message displays: "Disconnected in Elhub. A new one needs to be created."
  - Message is clearly readable
  - Message appears within 1-2 seconds of hover

#### TC-8280-005: Verify Norwegian Hover Message
- **Steps:**
  1. Set UI language to Norwegian
  2. Navigate to disconnected shared production
  3. Hover mouse over disabled "Edit Members" button
  4. Observe the tooltip/info message
- **Expected Result:** 
  - Message displays: "Avsluttet i Elhub. Opprett ny."
  - Message is clearly readable in Norwegian
  - Message appears within 1-2 seconds of hover

#### TC-8280-006: Verify Hover Message on Activate Button
- **Steps:**
  1. Navigate to disconnected shared production
  2. Hover mouse over disabled "Activate" button
  3. Observe the tooltip/info message
- **Expected Result:** 
  - Appropriate hover message appears
  - Message is consistent with other buttons
  - Message formatting is correct

---

### Scenario 3: Non-Disconnected Status Verification

**Objective:** Verify that buttons remain enabled when Elhub status is NOT Disconnected

**Preconditions:**
- Shared productions exist with various non-disconnected Elhub statuses
- User has edit permissions

**Test Cases:**

#### TC-8280-007: Verify Active Shared Production Buttons Enabled
- **Steps:**
  1. Navigate to a shared production with Elhub status = Active (not value 3)
  2. Observe "Edit Shared Production" button
  3. Observe "Edit Members" button
  4. Observe "Activate" button (if applicable)
- **Expected Result:** 
  - All buttons are enabled (not grayed out)
  - Buttons are clickable
  - No hover messages about disconnection appear

#### TC-8280-008: Verify Load Shedding Enabled Status Buttons
- **Steps:**
  1. Navigate to shared production with status "Load shedding enabled"
  2. Check all action buttons availability
- **Expected Result:** 
  - Buttons behave according to normal business rules for this status
  - Disconnection-specific disabling does NOT occur

#### TC-8280-009: Verify Other Status Values
- **Steps:**
  1. Test shared productions with Elhub status values 1, 2, 4, 5 (non-disconnected)
  2. Verify button states for each
- **Expected Result:** 
  - Disconnection logic only applies to status value 3
  - Other statuses follow their own business rules

---

### Scenario 4: Status Transition Testing

**Objective:** Verify button behavior changes correctly when status transitions to/from Disconnected

**Preconditions:**
- Ability to change Elhub status (test environment)
- Shared production in non-disconnected state

**Test Cases:**

#### TC-8280-010: Transition to Disconnected Status
- **Steps:**
  1. Open an active shared production with enabled buttons
  2. Change Elhub status to 3 (Disconnected) via test method
  3. Refresh or reload the shared production view
  4. Observe button states
- **Expected Result:** 
  - Buttons that were enabled become disabled
  - Hover messages appear on disabled buttons
  - UI updates without requiring logout/login

#### TC-8280-011: Transition from Disconnected Status
- **Steps:**
  1. Open a disconnected shared production (status 3)
  2. Change Elhub status to Active (non-disconnected)
  3. Refresh the view
  4. Observe button states
- **Expected Result:** 
  - Previously disabled buttons become enabled
  - Hover messages no longer appear
  - Edit and activate functionality becomes available

---

### Scenario 5: User Permission Testing

**Objective:** Verify that disabling logic applies regardless of user permission levels

**Preconditions:**
- Test users with different permission levels
- Disconnected shared productions

**Test Cases:**

#### TC-8280-012: Admin User with Disconnected Production
- **Steps:**
  1. Login as admin/super user
  2. Navigate to disconnected shared production
  3. Attempt to edit/activate
- **Expected Result:** 
  - Even high-privilege users see disabled buttons
  - Disconnection rule overrides permissions
  - Hover messages display for all users

#### TC-8280-013: Standard User with Disconnected Production
- **Steps:**
  1. Login as standard operational user
  2. Navigate to disconnected shared production
  3. Observe button states
- **Expected Result:** 
  - Buttons are disabled
  - Behavior consistent with admin user experience

---

### Scenario 6: Cross-Browser Testing

**Objective:** Verify functionality works across different browsers

**Test Cases:**

#### TC-8280-014: Chrome Browser Testing
- **Steps:**
  1. Access Perigon via Chrome
  2. Navigate to disconnected shared production
  3. Verify button disabling and hover messages
- **Expected Result:** Functionality works as designed

#### TC-8280-015: Edge Browser Testing
- **Steps:**
  1. Access Perigon via Edge
  2. Test button states and hover messages
- **Expected Result:** Functionality works as designed

#### TC-8280-016: Firefox Browser Testing
- **Steps:**
  1. Access Perigon via Firefox
  2. Verify all functionality
- **Expected Result:** Functionality works as designed

---

### Scenario 7: Negative Testing

**Objective:** Verify system handles edge cases and invalid scenarios gracefully

**Test Cases:**

#### TC-8280-017: Attempt Direct URL Access to Edit Function
- **Steps:**
  1. Note the URL when editing an active shared production
  2. Navigate to a disconnected shared production
  3. Manually modify URL to attempt accessing edit function
- **Expected Result:** 
  - System prevents editing even with direct URL manipulation
  - Appropriate error message or redirect occurs
  - No data corruption occurs

#### TC-8280-018: Concurrent Status Change During Edit Attempt
- **Steps:**
  1. Have two users access the same shared production
  2. User 1 begins edit while status is active
  3. User 2 changes status to disconnected
  4. User 1 attempts to save changes
- **Expected Result:** 
  - System handles gracefully
  - Appropriate validation error occurs
  - Data integrity maintained

#### TC-8280-019: Null or Missing Elhub Status
- **Steps:**
  1. Test with shared production that has null/missing Elhub status (if possible in test environment)
  2. Observe button behavior
- **Expected Result:** 
  - System handles gracefully
  - Buttons either enabled (safe default) or appropriate error shown
  - No application crash

---

## Test Data Requirements

### Required Test Data

1. **Shared Productions with Various Statuses:**
   - Minimum 3 shared productions with Elhub status = 3 (Disconnected)
   - Minimum 2 shared productions with Active status
   - 1 shared production with each other valid Elhub status
   - Shared productions with members configured

2. **User Accounts:**
   - Admin/Super user account
   - Standard operational user account
   - Read-only user account (for permission testing)

3. **Configuration:**
   - Test environment with Norwegian market configuration
   - Both English and Norwegian language settings available
   - Grid owner data configured

### Test Environment
- **Environment:** TestPri_Team / Perigon (DSO)
- **Module:** Metering Point - Shared Production
- **Database:** Test database with Norway market configuration
- **Access:** Perigon test environment URL

---

## Risk Assessment

### High Risk Areas

1. **Status Detection Logic**
   - **Risk:** Incorrect Elhub status value interpretation could enable editing when should be disabled
   - **Mitigation:** Thorough testing of status value 3 specifically and boundary values
   - **Likelihood:** Low | **Impact:** High

2. **UI Button State Management**
   - **Risk:** Buttons appear disabled but are still functionally clickable
   - **Mitigation:** Test both visual state and functional blocking
   - **Likelihood:** Medium | **Impact:** High

3. **Localization Issues**
   - **Risk:** Hover messages don't appear in correct language or are missing
   - **Mitigation:** Test both English and Norwegian thoroughly
   - **Likelihood:** Medium | **Impact:** Medium

### Medium Risk Areas

4. **Browser Compatibility**
   - **Risk:** Hover tooltips don't render correctly in all browsers
   - **Mitigation:** Cross-browser testing
   - **Likelihood:** Medium | **Impact:** Medium

5. **Status Transition Timing**
   - **Risk:** UI doesn't update immediately when status changes
   - **Mitigation:** Test refresh/reload scenarios
   - **Likelihood:** Medium | **Impact:** Low

### Low Risk Areas

6. **Permission Conflicts**
   - **Risk:** High-level permissions might bypass the restriction
   - **Mitigation:** Test with various user roles
   - **Likelihood:** Low | **Impact:** Medium

---

## Resources Needed

### Test Team
- **Lead Tester:** TBD
- **Functional Testers:** 1-2 testers
- **Estimated Effort:** 8-12 hours

### Test Environment
- Perigon TestPri_Team environment
- Test database with Norway configuration
- Access to Elhub test data

### Tools
- Standard web browsers (Chrome, Edge, Firefox)
- Screen capture tool for defect documentation
- Test management tool access (Jira/Zephyr)

### Documentation
- Shared Production module documentation
- Elhub status code reference
- UI Style Guide for disabled button standards

---

## Dependencies

### Internal Dependencies
- Development completion of GRID-8280
- Test environment availability
- Test data setup completion

### External Dependencies
- None identified

### Blocking Issues
- GRID-8263 (related shared production deactivation issue) - should be resolved to avoid confusion

---

## Test Entry Criteria

- [ ] GRID-8280 marked as "Ready for Test"
- [ ] Code deployed to test environment
- [ ] Test data created (disconnected and active shared productions)
- [ ] Test environment accessible
- [ ] Tester has appropriate access permissions

---

## Test Exit Criteria

- [ ] All planned test cases executed
- [ ] No Critical or High severity defects open
- [ ] All Medium severity defects reviewed and accepted/fixed
- [ ] Cross-browser testing completed
- [ ] Localization (English/Norwegian) verified
- [ ] Test results documented in GRID-8281
- [ ] Sign-off from QA lead

---

## Test Execution Schedule

| Phase | Activities | Duration | Dependencies |
|-------|-----------|----------|--------------|
| **Preparation** | Test data setup, environment verification | 2 hours | Test environment ready |
| **Functional Testing** | Scenarios 1-3 execution | 4 hours | Test data ready |
| **Status Transition** | Scenario 4 execution | 2 hours | Functional tests passed |
| **Permissions & Browser** | Scenarios 5-6 execution | 2 hours | Core functionality verified |
| **Negative Testing** | Scenario 7 execution | 1 hour | All positive tests passed |
| **Regression** | Related features verification | 1 hour | All tests executed |
| **Reporting** | Defect logging, test summary | 1 hour | Testing complete |

**Total Estimated Effort:** 13 hours

---

## Defect Management

### Severity Definitions

- **Critical:** Application crash, data loss, security breach
- **High:** Feature completely non-functional, blocks testing
- **Medium:** Feature partially functional, workaround exists
- **Low:** Cosmetic issues, minor inconvenience

### Defect Reporting Process
1. Log defects in Jira linked to GRID-8280 and GRID-8281
2. Include screenshots showing issue
3. Provide steps to reproduce
4. Note environment and browser details
5. Tag with "SharedProduction" label

---

## Test Deliverables

1. **Test Execution Report**
   - Test cases passed/failed summary
   - Defects found and status
   - Browser compatibility matrix
   - Test coverage metrics

2. **Defect Reports**
   - All defects logged in Jira
   - Linked to GRID-8280 and GRID-8281

3. **Test Evidence**
   - Screenshots of disabled buttons
   - Screenshots of hover messages (both languages)
   - Screen recordings of status transitions

4. **Sign-off Document**
   - QA approval for deployment
   - Known issues documentation

---

## Notes and Assumptions

### Assumptions
1. Elhub status value 3 consistently represents "Disconnected" across all environments
2. Only Norwegian market customers use Shared Production feature
3. Hover message implementation follows standard Perigon tooltip patterns
4. No API-level access to edit disconnected productions is exposed

### Special Considerations
1. This feature is specifically for the Norwegian market (Elhub integration)
2. Testing should verify that creating a NEW shared production is still possible (not blocked by this change)
3. Watch for related issue GRID-8263 regarding deactivation setting wrong status

### Related Documentation
- [Shared Production Technical Documentation](https://hansentechnologies.atlassian.net/wiki/spaces/TGR/pages/3828155794/Technical+document)
- [Split Common Production - Norway](https://hansentechnologies.atlassian.net/wiki/spaces/TGR/pages/3764063604/Split+Common+Production+-+Norway)

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| **QA Lead** | | | |
| **Test Manager** | | | |
| **Product Owner** | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-11 | Test Planner Assistant | Initial test plan creation |

---

## Appendix A: Test Case Traceability Matrix

| Requirement | Test Cases | Coverage |
|-------------|-----------|----------|
| Disable edit shared production button when disconnected | TC-8280-001, TC-8280-007, TC-8280-010, TC-8280-011 | 100% |
| Disable edit members button when disconnected | TC-8280-002, TC-8280-007 | 100% |
| Disable activate button when disconnected | TC-8280-003, TC-8280-007 | 100% |
| Display English hover message | TC-8280-004 | 100% |
| Display Norwegian hover message | TC-8280-005 | 100% |
| Only apply to Elhub status = 3 | TC-8280-007, TC-8280-008, TC-8280-009 | 100% |

---

## Appendix B: Elhub Status Reference

| Status Value | Status Name | Button Behavior |
|--------------|-------------|-----------------|
| 1 | Active | Enabled |
| 2 | Load Shedding Enabled | Enabled (unless other rules apply) |
| **3** | **Disconnected** | **DISABLED** (this feature) |
| 4 | Other Status | Enabled (unless other rules apply) |

---

*End of Test Plan*
