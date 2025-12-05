#!/usr/bin/env python3
import argparse
import os
import random
import datetime as dt

import pandas as pd

def load_reference_data(input_dir: str):
  county = pd.read_csv(os.path.join(input_dir, "county.csv"))
  country = pd.read_csv(os.path.join(input_dir, "country.csv"))
  parish = pd.read_csv(os.path.join(input_dir, "parish.csv"))
  animal_types = pd.read_csv(os.path.join(input_dir, "animal-types.csv"))

  # Join parish -> county -> country so each parish knows its CountryName/Code
  parish_join = (
    parish
    .merge(county, on="CountyCode")
    .merge(country, on="CountryCode", suffixes=("_county", "_country"))
  )

  # Build CPH using CountyCode(2) / ParishCode(3) / HoldingCode(4, random)
  def make_cph(r):
    holding = random.randint(0, 9999)  # 4-digit random holding code
    return f"{int(r.CountyCode):02d}/{int(r.ParishCode):03d}/{holding:04d}"

  parish_join["CPH"] = parish_join.apply(make_cph, axis=1)

  # Split parishes by country for quick sampling
  parishes_by_country = {
    name: df.reset_index(drop=True)
    for name, df in parish_join.groupby("CountryName")
  }

  # Map our 4 animal groups to codes from animal-types.csv
  # bovine -> Cattle, pig -> Pigs, sheep -> Sheep, deer -> Deer
  def get_code(desc: str) -> str:
    row = animal_types[animal_types["Description"] == desc]
    if row.empty:
      raise RuntimeError(f"Could not find animal type with Description='{desc}'")
    return row["Code"].iloc[0]

  animal_code_map = {
    "bovine": get_code("Cattle"),
    "pig": get_code("Pigs"),
    "sheep": get_code("Sheep"),
    "deer": get_code("Deer"),
  }

  return parishes_by_country, animal_code_map, country


def choose_countries(movement_cat: str):
  """
  movement_cat:
    EE = intra England
    WW = intra Wales
    SS = intra Scotland
    EW = England <-> Wales
    ES = England <-> Scotland
    WS = Wales <-> Scotland
  """
  if movement_cat == "EE":
    return "England", "England"
  if movement_cat == "WW":
    return "Wales", "Wales"
  if movement_cat == "SS":
    return "Scotland", "Scotland"
  if movement_cat == "EW":
    return ("England", "Wales") if random.random() < 0.5 else ("Wales", "England")
  if movement_cat == "ES":
    return ("England", "Scotland") if random.random() < 0.5 else ("Scotland", "England")
  if movement_cat == "WS":
    return ("Wales", "Scotland") if random.random() < 0.5 else ("Scotland", "Wales")
  raise RuntimeError(f"Unknown movement category: {movement_cat}")


def choose_source_count(species: str) -> int:
  """
  Per-row min/max:
    - bovine: 1–10
    - pig:    1–60
    - sheep:  1–60
    - deer:   1–40
  """
  if species == "bovine":
    return random.randint(1, 10)
  if species == "pig":
    return random.randint(1, 60)
  if species == "sheep":
    return random.randint(1, 60)
  if species == "deer":
    return random.randint(1, 40)
  raise RuntimeError(f"Unknown species: {species}")


def choose_target_count(src_count: int, change_cat: str) -> int:
  """
  Count-change rules:
    - 90% same
    - 8%  between 1 and 5 less (but not < 1 total)
    - 2%  between 1 and 2 more
  """
  if change_cat == "same":
    return src_count
  elif change_cat == "less":
    max_loss = min(5, src_count - 1)  # ensure at least 1 animal remains
    if max_loss < 1:
      # Fall back to same if we can't lose any
      return src_count
    loss = random.randint(1, max_loss)
    return src_count - loss
  elif change_cat == "more":
    gain = random.randint(1, 2)
    return src_count + gain
  else:
    raise RuntimeError(f"Unknown change category: {change_cat}")


def generate_movements(
  parishes_by_country,
  animal_code_map,
  num_rows: int = 10_000,
  seed: int | None = None,
):
  if seed is not None:
    random.seed(seed)

  # movement category weights:
  # - 50% intra England
  # - 15% intra Wales
  # - 10% intra Scotland
  # - 10% England/Wales (either direction)
  # - 10% England/Scotland (either direction)
  # - 5%  Wales/Scotland (either direction)
  movement_categories = ["EE", "WW", "SS", "EW", "ES", "WS"]
  movement_weights = [0.50, 0.15, 0.10, 0.10, 0.10, 0.05]

  # species distribution:
  # - 50% bovine
  # - 20% pig
  # - 20% sheep
  # - 10% deer
  species_list = ["bovine", "pig", "sheep", "deer"]
  species_weights = [0.50, 0.20, 0.20, 0.10]

  # count change distribution:
  # - 90% same
  # - 8% less
  # - 2% more
  change_categories = ["same", "less", "more"]
  change_weights = [0.90, 0.08, 0.02]

  # base date (you can tweak this if needed)
  base_date = dt.date(2024, 1, 1)

  # simple pool of hauliers
  hauliers = [f"H{idx:04d}" for idx in range(1, 101)]

  rows = []

  for _ in range(num_rows):
    # 1) movement category and source/destination countries
    mov_cat = random.choices(movement_categories, movement_weights)[0]
    src_country, dst_country = choose_countries(mov_cat)

    src_df = parishes_by_country[src_country]
    dst_df = parishes_by_country[dst_country]

    # 2) pick source and destination parishes, making sure CPH differs
    src_row = src_df.sample(1).iloc[0]
    while True:
      dst_row = dst_df.sample(1).iloc[0]
      if src_row["CPH"] != dst_row["CPH"]:
        break

    src_cph = src_row["CPH"]
    dst_cph = dst_row["CPH"]

    # 3) pick species and map to animal type code from animal-types.csv
    species = random.choices(species_list, species_weights)[0]
    animal_code = animal_code_map[species]

    # 4) pick counts
    src_count = choose_source_count(species)
    change_cat = random.choices(change_categories, change_weights)[0]
    dst_count = choose_target_count(src_count, change_cat)

    # 5) pick dates (target >= source, up to +3 days)
    offset_days = random.randint(0, 364)
    src_date = base_date + dt.timedelta(days=offset_days)
    dst_date = src_date + dt.timedelta(days=random.randint(0, 3))

    # 6) haulier
    haulier_id = random.choice(hauliers)

    rows.append(
      {
        "source-cph": src_cph,
        "source-count": src_count,
        "source-date": src_date.isoformat(),
        "target-cph": dst_cph,
        "target-count": dst_count,
        "target-date": dst_date.isoformat(),
        "animal-type": animal_code,  # BOV / POR / OVI / CERV, from animal-types.csv
        "haulier-id": haulier_id,
      }
    )

  return pd.DataFrame(rows)


def main():
  parser = argparse.ArgumentParser(
    description="Generate synthetic livestock movement data for England, Wales, and Scotland."
  )
  parser.add_argument(
    "-n", "--num-rows",
    type=int,
    default=10_000,
    help="Number of movement rows to generate (default: 10000)",
  )
  parser.add_argument(
    "--seed",
    type=int,
    default=42,
    help="Random seed for reproducibility (default: 42)",
  )
  parser.add_argument(
    "-i", "--input-dir",
    default=".",
    help="Directory containing county.csv, country.csv, parish.csv, animal-types.csv (default: current dir)",
  )
  parser.add_argument(
    "-o", "--output",
    default="movements.csv",
    help="Output CSV filename (default: movements.csv)",
  )
  args = parser.parse_args()

  parishes_by_country, animal_code_map, _ = load_reference_data(args.input_dir)
  df = generate_movements(
    parishes_by_country=parishes_by_country,
    animal_code_map=animal_code_map,
    num_rows=args.num_rows,
    seed=args.seed,
  )

  df.to_csv(args.output, index=False)
  print(f"Wrote {len(df)} rows to {args.output}")


if __name__ == "__main__":
  main()
