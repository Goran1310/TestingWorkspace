-- =============================================================================
-- Backend test: B2B Sales delivery-site search by EAN
-- EAN      : 707057500050000027
-- Database : Enoro.Ag.Kraft (EWVEAGKR), schema user EWOPD
--
-- Mirrors what POST /b2bsales/deliverysite/search-bulk does for a NO install
-- (B2BSalesDeliverySiteSearchService.SearchAsync -> DeliverySiteRepository):
--   Step 1  EAN check-digit validation (same rule as p_search_elhub)
--   Step 2  Internal lookup   felles.finn_maalepktnr_fra_ean
--   Step 3  Internal search   felles.pkg_ccmapi_deliverysite.p_search
--           (only called by the app when a customer is selected -> set c_customer_id)
--   Step 4  Elhub search      felles.pkg_ccmapi_deliverysite.p_search_elhub
--           with the same defaults as ElhubDeliverySiteRequest
--           (OnlyActiveDeliverySites = 1, ApplyWildcard = 1)
--   Step 5  Same Elhub search with onlyactivedeliverysites = 0, to see whether
--           the site exists but is filtered out as non-active
--
-- Read-only intent: p_search_elhub calls Elhub BRS-611 and writes log rows.
-- The script ends with ROLLBACK.
-- =============================================================================
SET SERVEROUTPUT ON SIZE UNLIMITED

DECLARE
    c_ean          CONSTANT VARCHAR2(18) := '707057500050000027';
    c_customer_id  CONSTANT NUMBER       := NULL;  -- set to the B2B customer id to exercise the internal path
    c_environment  CONSTANT VARCHAR2(30) := 'Production'; -- anything except 'Development' (that returns fake data)

    l_expected_cd  VARCHAR2(1);
    l_actual_cd    VARCHAR2(1);
    l_mp_no        NUMBER;
    l_json         CLOB;
    l_cur          SYS_REFCURSOR;
    l_count        PLS_INTEGER;
    l_failures     PLS_INTEGER := 0;

    PROCEDURE result(p_name VARCHAR2, p_ok BOOLEAN, p_detail VARCHAR2) IS
    BEGIN
        DBMS_OUTPUT.PUT_LINE(RPAD(p_name, 34) || CASE WHEN p_ok THEN 'PASS  ' ELSE 'FAIL  ' END || p_detail);
        IF NOT p_ok THEN l_failures := l_failures + 1; END IF;
    END;

    FUNCTION count_cursor(p_cur IN OUT SYS_REFCURSOR) RETURN PLS_INTEGER IS
        l_ctx  INTEGER;
        l_rows PLS_INTEGER := 0;
    BEGIN
        IF p_cur IS NULL OR NOT p_cur%ISOPEN THEN RETURN 0; END IF;
        l_ctx := DBMS_SQL.TO_CURSOR_NUMBER(p_cur);
        WHILE DBMS_SQL.FETCH_ROWS(l_ctx) > 0 LOOP l_rows := l_rows + 1; END LOOP;
        DBMS_SQL.CLOSE_CURSOR(l_ctx);
        RETURN l_rows;
    END;

    FUNCTION elhub_hits(p_only_active INTEGER) RETURN PLS_INTEGER IS
        l_c SYS_REFCURSOR;
    BEGIN
        felles.pkg_ccmapi_deliverysite.p_search_elhub(
            cur                     => l_c,
            customertype            => 0,
            postcode                => NULL,
            ean                     => c_ean,
            onlyactivedeliverysites => p_only_active,
            applywildcard           => 1,
            in_environment          => c_environment);
        RETURN count_cursor(l_c);
    END;
BEGIN
    DBMS_OUTPUT.PUT_LINE('B2B Sales EAN search test  EAN=' || c_ean || '  DB=' || SYS_CONTEXT('USERENV', 'DB_NAME'));
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 90, '-'));

    -- Step 1: check digit
    l_expected_cd := felles.pkg_std_felles.modulus_u_maaler(RPAD(SUBSTR(c_ean, 1, 17), 17));
    l_actual_cd   := SUBSTR(c_ean, 18, 1);
    result('1 EAN check digit',
           l_expected_cd = l_actual_cd,
           'expected=' || l_expected_cd || ' actual=' || l_actual_cd ||
           CASE WHEN l_expected_cd <> l_actual_cd
                THEN '  -> p_search_elhub replaces the EAN with NULL before calling Elhub' END);

    -- Step 2: internal metering point
    l_mp_no := NULLIF(felles.pkg_efmaalepunkt.finn_maalepktnr_fra_ean(in_maalepunkt => c_ean), 0);
    result('2 Internal metering point', l_mp_no IS NOT NULL, 'maalepktnr=' || NVL(TO_CHAR(l_mp_no), '<none>'));

    -- Step 3: internal search (only meaningful with a customer)
    IF c_customer_id IS NULL THEN
        DBMS_OUTPUT.PUT_LINE(RPAD('3 Internal p_search', 34) || 'SKIP  no customer selected (same as the UI retest)');
    ELSE
        felles.pkg_ccmapi_deliverysite.p_search(
            cur                          => l_json,
            in_no                        => NULL,
            in_id                        => c_ean,
            in_customerid                => c_customer_id,
            in_customerfirstname         => NULL,
            in_customerlastname          => NULL,
            in_customerpersonalid        => NULL,
            in_customerbusinessid        => NULL,
            in_streetname                => NULL,
            in_buildingnumber            => NULL,
            in_buildingletter            => NULL,
            in_apartment                 => NULL,
            in_countrycode               => NULL,
            in_postcode                  => NULL,
            in_cityname                  => NULL,
            in_meterid                   => NULL,
            in_pageno                    => NULL,
            in_pagesize                  => NULL,
            in_expandaddressdata         => 0,
            in_culture                   => NULL,
            in_includependingtermination => 1,
            in_onlyactivemp              => 1);
        result('3 Internal p_search',
               l_json IS NOT NULL AND DBMS_LOB.GETLENGTH(l_json) > 2,
               'json=' || NVL(DBMS_LOB.SUBSTR(l_json, 200, 1), '<null>'));
    END IF;

    -- Step 4: Elhub search exactly as the app calls it
    l_count := elhub_hits(1);
    result('4 Elhub search (active only)', l_count > 0, 'rows=' || l_count);

    -- Step 5: Elhub search including non-active sites (diagnostic)
    l_count := elhub_hits(0);
    result('5 Elhub search (incl. inactive)', l_count > 0, 'rows=' || l_count);

    DBMS_OUTPUT.PUT_LINE(RPAD('-', 90, '-'));
    DBMS_OUTPUT.PUT_LINE(CASE WHEN l_failures = 0
                              THEN 'RESULT: PASS - backend would return the delivery site'
                              ELSE 'RESULT: FAIL (' || l_failures || ') - backend returns "Not found", same as the UI' END);
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        DBMS_OUTPUT.PUT_LINE(DBMS_UTILITY.FORMAT_ERROR_BACKTRACE);
        RAISE;
END;
/
