-- =============================================================================
-- B2B Sales bulk EAN search - backend test (Enoro.Ag.Kraft / EWVEAGKR)
--
-- Runs, for every EAN in the list, the same backend checks as the single-EAN
-- test (b2bsales_ean_search_707057500050000318.sql):
--   CD   check digit (felles.pkg_std_felles.modulus_u_maaler) - p_search_elhub
--        replaces the EAN with NULL when it fails
--   MP   internal metering point (felles.pkg_efmaalepunkt.finn_maalepktnr_fra_ean)
--   CUST customer linked in felles.efmaalepktjurrole (latest row) + whether the
--        link is still active today
--   INT  felles.pkg_ccmapi_deliverysite.p_search with that customer (only active MPs)
--   EH   felles.pkg_ccmapi_deliverysite.p_search_elhub as the app calls it
--        (only when CD is valid - an invalid EAN is nulled, so Elhub gets no input)
--
-- Read-only: ends with ROLLBACK.
-- =============================================================================
SET SERVEROUTPUT ON SIZE UNLIMITED

DECLARE
    c_environment CONSTANT VARCHAR2(30) := 'Production';
    c_call_elhub  CONSTANT BOOLEAN      := TRUE;  -- set FALSE to skip Elhub web-service calls

    l_eans sys.odcivarchar2list := sys.odcivarchar2list(
        '707057500050000024', '707057500050000026', '707057500050000027', '707057500050000029', '707057500050000030', '707057500050000032',
        '707057500050000035', '707057500050000036', '707057500050000037', '707057500050000039', '707057500050000041', '707057500050000043',
        '707057500050000044', '707057500050000045', '707057500050000046', '707057500050000048', '707057500050000049', '707057500050000051',
        '707057500050000059', '707057500050000060', '707057500050000061', '707057500050000062', '707057500050000064', '707057500050000065',
        '707057500050000066', '707057500050000067', '707057500050000090', '707057500050000092', '707057500050000095', '707057500050000097',
        '707057500050000103', '707057500050000104', '707057500050000106', '707057500050000107', '707057500050000108', '707057500050000109',
        '707057500050000110', '707057500050000111', '707057500050000116', '707057500050000117', '707057500050000124', '707057500050000130',
        '707057500050000134', '707057500050000137', '707057500050000138', '707057500050000139', '707057500050000140', '707057500050000147',
        '707057500050000148', '707057500050000149', '707057500050000150', '707057500050000151', '707057500050000152', '707057500050000153',
        '707057500050000158', '707057500050000159', '707057500050000160', '707057500050000161', '707057500050000165', '707057500050000166',
        '707057500050000169', '707057500050000170', '707057500050000173', '707057500050000175', '707057500050000176', '707057500050000179',
        '707057500050000189', '707057500050000190', '707057500050000191', '707057500050000192', '707057500050000193', '707057500050000194',
        '707057500050000195', '707057500050000200', '707057500050000201', '707057500050000208', '707057500050000209', '707057500050000211',
        '707057500050000217', '707057500050000218', '707057500050000219', '707057500050000220', '707057500050000222', '707057500050000227',
        '707057500050000229', '707057500050000230', '707057500050000231', '707057500050000232', '707057500050000233', '707057500050000237',
        '707057500050000238', '707057500050000239', '707057500050000252', '707057500050000256', '707057500050000257', '707057500050000258',
        '707057500050000259', '707057500050000260', '707057500050000261', '707057500050000262', '707057500050000263', '707057500050000265',
        '707057500050000266', '707057500050000267', '707057500050000268', '707057500050000269', '707057500050000270', '707057500050000271',
        '707057500050000275', '707057500050000276', '707057500050000277', '707057500050000279', '707057500050000280', '707057500050000281',
        '707057500050000282', '707057500050000284', '707057500050000285', '707057500050000286', '707057500050000287', '707057500050000288',
        '707057500050000289', '707057500050000290', '707057500050000291', '707057500050000292', '707057500050000293', '707057500050000295',
        '707057500050000298', '707057500050000300', '707057500050000301', '707057500050000302', '707057500050000303', '707057500050000304',
        '707057500050000305', '707057500050000306', '707057500050000307', '707057500050000308', '707057500050000309', '707057500050000311',
        '707057500050000314', '707057500050000315', '707057500050000316', '707057500050000317', '707057500050000318', '707057500050000321',
        '707057500050000324', '707057500050000325', '707057500050000326', '707057500050000327', '707057500050000328', '707057500080530382',
        '707057500080530405', '707057500080530443', '707057500080530450', '707057500080530658', '707057500080530788', '707057500080530825',
        '707057500080531365', '707057500080531662', '707057500080531952', '707057500080533109', '707057500080534342', '707057500080534366',
        '707057500080534519', '707057500080534540', '707057500080534588', '707057500080534885'
    );

    l_exp_cd   VARCHAR2(1);
    l_cd_ok    BOOLEAN;
    l_mp       NUMBER;
    l_cust     NUMBER;
    l_todate   DATE;
    l_active   BOOLEAN;
    l_json     CLOB;
    l_int      VARCHAR2(10);
    l_eh       VARCHAR2(10);
    l_found    BOOLEAN;

    n_total NUMBER := 0; n_bad_cd NUMBER := 0; n_no_mp NUMBER := 0;
    n_inactive NUMBER := 0; n_int_hit NUMBER := 0; n_eh_hit NUMBER := 0; n_found NUMBER := 0;

    FUNCTION count_cursor(p_cur IN OUT SYS_REFCURSOR) RETURN PLS_INTEGER IS
        l_ctx INTEGER; l_rows PLS_INTEGER := 0;
    BEGIN
        IF p_cur IS NULL OR NOT p_cur%ISOPEN THEN RETURN 0; END IF;
        l_ctx := DBMS_SQL.TO_CURSOR_NUMBER(p_cur);
        WHILE DBMS_SQL.FETCH_ROWS(l_ctx) > 0 LOOP l_rows := l_rows + 1; END LOOP;
        DBMS_SQL.CLOSE_CURSOR(l_ctx);
        RETURN l_rows;
    END;
BEGIN
    DBMS_OUTPUT.PUT_LINE('B2B Sales bulk EAN test  DB=' || SYS_CONTEXT('USERENV', 'DB_NAME') || '  EANs=' || l_eans.COUNT);
    DBMS_OUTPUT.PUT_LINE(RPAD('EAN', 20) || RPAD('CD(exp/act)', 13) || RPAD('MP', 10) || RPAD('CUST', 10) ||
                         RPAD('LINK TODATE', 13) || RPAD('INT', 6) || RPAD('EH', 6) || 'RESULT');
    DBMS_OUTPUT.PUT_LINE(RPAD('-', 100, '-'));

    FOR i IN 1 .. l_eans.COUNT LOOP
        n_total := n_total + 1;
        l_exp_cd := felles.pkg_std_felles.modulus_u_maaler(RPAD(SUBSTR(l_eans(i), 1, 17), 17));
        l_cd_ok  := l_exp_cd = SUBSTR(l_eans(i), 18, 1);
        IF NOT l_cd_ok THEN n_bad_cd := n_bad_cd + 1; END IF;

        l_mp := NULLIF(felles.pkg_efmaalepunkt.finn_maalepktnr_fra_ean(in_maalepunkt => l_eans(i)), 0);
        IF l_mp IS NULL THEN n_no_mp := n_no_mp + 1; END IF;

        l_cust := NULL; l_todate := NULL; l_active := FALSE;
        IF l_mp IS NOT NULL THEN
            BEGIN
                SELECT kundenr, todate INTO l_cust, l_todate FROM (
                    SELECT kundenr, todate FROM felles.efmaalepktjurrole
                     WHERE maalepktnr = l_mp AND kundenr IS NOT NULL
                     ORDER BY fromdate DESC, NVL(todate, DATE '9999-12-31') DESC)
                 WHERE ROWNUM = 1;
                l_active := l_todate IS NULL OR l_todate > TRUNC(SYSDATE);
            EXCEPTION WHEN NO_DATA_FOUND THEN NULL;
            END;
            IF NOT l_active THEN n_inactive := n_inactive + 1; END IF;
        END IF;

        l_int := '-';
        IF l_cust IS NOT NULL THEN
            l_json := NULL;
            felles.pkg_ccmapi_deliverysite.p_search(
                cur => l_json, in_no => NULL, in_id => l_eans(i), in_customerid => l_cust,
                in_customerfirstname => NULL, in_customerlastname => NULL, in_customerpersonalid => NULL,
                in_customerbusinessid => NULL, in_streetname => NULL, in_buildingnumber => NULL,
                in_buildingletter => NULL, in_apartment => NULL, in_countrycode => NULL, in_postcode => NULL,
                in_cityname => NULL, in_meterid => NULL, in_pageno => NULL, in_pagesize => NULL,
                in_expandaddressdata => 0, in_culture => NULL, in_includependingtermination => 1,
                in_onlyactivemp => 1);
            l_int := CASE WHEN l_json IS NOT NULL AND DBMS_LOB.GETLENGTH(l_json) > 2 THEN 'HIT' ELSE '0' END;
            IF l_int = 'HIT' THEN n_int_hit := n_int_hit + 1; END IF;
        END IF;

        l_eh := 'skip';
        IF l_cd_ok AND c_call_elhub THEN
            DECLARE l_c SYS_REFCURSOR; l_n PLS_INTEGER;
            BEGIN
                felles.pkg_ccmapi_deliverysite.p_search_elhub(
                    cur => l_c, customertype => 0, postcode => NULL, ean => l_eans(i),
                    onlyactivedeliverysites => 1, applywildcard => 1, in_environment => c_environment);
                l_n := count_cursor(l_c);
                l_eh := TO_CHAR(l_n);
                IF l_n > 0 THEN n_eh_hit := n_eh_hit + 1; END IF;
            EXCEPTION WHEN OTHERS THEN l_eh := 'ERR';
            END;
        END IF;

        l_found := l_int = 'HIT' OR (l_eh NOT IN ('skip', 'ERR', '0'));
        IF l_found THEN n_found := n_found + 1; END IF;

        DBMS_OUTPUT.PUT_LINE(
            RPAD(l_eans(i), 20) ||
            RPAD(CASE WHEN l_cd_ok THEN 'OK ' ELSE 'BAD ' END || l_exp_cd || '/' || SUBSTR(l_eans(i), 18, 1), 13) ||
            RPAD(NVL(TO_CHAR(l_mp), '-'), 10) ||
            RPAD(NVL(TO_CHAR(l_cust), '-'), 10) ||
            RPAD(CASE WHEN l_cust IS NULL THEN '-' WHEN l_todate IS NULL THEN 'open' ELSE TO_CHAR(l_todate, 'DD.MM.YYYY') END, 13) ||
            RPAD(l_int, 6) || RPAD(l_eh, 6) ||
            CASE WHEN l_found THEN 'FOUND' ELSE 'NOT FOUND' END);
    END LOOP;

    DBMS_OUTPUT.PUT_LINE(RPAD('-', 100, '-'));
    DBMS_OUTPUT.PUT_LINE('SUMMARY total=' || n_total || '  bad_check_digit=' || n_bad_cd || '  no_internal_mp=' || n_no_mp ||
                         '  customer_link_ended=' || n_inactive || '  internal_hits=' || n_int_hit ||
                         '  elhub_hits=' || n_eh_hit || '  found=' || n_found || '  not_found=' || (n_total - n_found));
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('ERROR: ' || SQLERRM);
        DBMS_OUTPUT.PUT_LINE(DBMS_UTILITY.FORMAT_ERROR_BACKTRACE);
        RAISE;
END;
/
