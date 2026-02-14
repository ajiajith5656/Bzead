#!/usr/bin/env python3
"""Execute SQL file against Supabase via the Management API."""
import json
import os
import sys
import urllib.request

PROJECT_REF = "lzgzpifqwtsxzvbflcul"
TOKEN = os.environ.get("SUPABASE_ACCESS_TOKEN", "")
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_sql(sql: str, label: str = ""):
    """Execute a SQL statement via the Management API."""
    data = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            if label:
                print(f"  OK: {label}")
            return body
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  FAIL: {label} -> {e.code}: {err[:300]}")
        return None

def main():
    if not TOKEN:
        print("ERROR: Set SUPABASE_ACCESS_TOKEN env var")
        sys.exit(1)

    sql_file = sys.argv[1] if len(sys.argv) > 1 else "/workspaces/Bzead/supabase_rls_fix.sql"
    with open(sql_file) as f:
        full_sql = f.read()

    # Split on the section headers to execute in chunks
    # But first, just try the whole thing at once
    print("Executing full RLS fix SQL...")
    result = run_sql(full_sql, "full script")
    
    if result is not None:
        print(f"\nResult: {result[:500]}")
        print("\nVerifying...")
        verify = run_sql("SELECT count(*) as policy_count FROM pg_policies WHERE schemaname = 'public'", "policy count")
        print(f"Policies after fix: {verify}")
        
        # Test that countries is now accessible
        test = run_sql("SELECT id, country_name FROM countries LIMIT 3", "test countries")
        print(f"Countries test: {test}")
    else:
        print("\nFull script failed, trying in chunks...")
        # Split by the STEP comments and execute each
        chunks = full_sql.split("-- ╔")
        for i, chunk in enumerate(chunks):
            if not chunk.strip() or chunk.strip().startswith("=="):
                continue
            sql = "-- ╔" + chunk if i > 0 else chunk
            # Remove pure comment lines for label
            lines = [l for l in sql.split("\n") if l.strip() and not l.strip().startswith("--")]
            label = f"chunk {i} ({len(lines)} statements)"
            run_sql(sql, label)
        
        print("\nVerifying...")
        verify = run_sql("SELECT count(*) as policy_count FROM pg_policies WHERE schemaname = 'public'", "policy count")
        print(f"Policies after fix: {verify}")

if __name__ == "__main__":
    main()
