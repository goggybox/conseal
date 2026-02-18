
# --------------------------------------------------------------------
# This file is part of Conseal <https://conse.al/>.
# Copyright (C) 2026 goggybox <https://github.com/goggybox>
# Copyright (C) 2014 Electronic Frontier Foundation <https://www.eff.org/>

# Please keep this header comment in all copies of the program.
# --------------------------------------------------------------------

import json
import csv

DATASET_FILE = "categorised_dataset.txt"
DUMP_FILE = "dump.json"
OUTPUT_FILE = "dump_with_categories.json"


def load_category_map(filepath):
    category_map = {}

    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            domain = row["domain"].strip().lower()
            category = row["iab_tier2"].strip()
            category_map[domain] = category

    return category_map


def normalise_domain(domain):
    domain = domain.strip().lower()
    if domain.startswith("www."):
        domain = domain[4:]
    return domain


def get_category_for_urls(url_string, category_map):
    domains = [normalise_domain(d) for d in url_string.split(",")]

    for domain in domains:
        if domain in category_map:
            return category_map[domain]

    return "unknown"


def main():
    category_map = load_category_map(DATASET_FILE)

    with open(DUMP_FILE, encoding='utf-8') as f:
        data = json.load(f)

    for entry in data:
        url_string = entry.get("url", "")
        category = get_category_for_urls(url_string, category_map)
        entry["category"] = category

    with open(OUTPUT_FILE, "w", encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print(f"Updated file written to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
