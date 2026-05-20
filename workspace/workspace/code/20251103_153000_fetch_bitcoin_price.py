#!/usr/bin/env python3
"""
Fetch current Bitcoin price from Binance API and print with timestamp.
"""

import urllib.request
import json
import sys
from datetime import datetime

def fetch_bitcoin_price():
    url = "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            if response.status != 200:
                raise RuntimeError(f"HTTP error {response.status}")
            data = json.loads(response.read().decode())
            price = data.get("price")
            if price is None:
                raise KeyError("price field missing in response")
            return float(price)
    except Exception as e:
        print(f"Error fetching price: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    price = fetch_bitcoin_price()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] Bitcoin price: ${price:,.2f}")

if __name__ == "__main__":
    main()