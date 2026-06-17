"""Tests for the pure USDA / AI parsing helpers (audit C2, M1)."""
import pytest
from backend.services.nutrition import extract_macros_from_usda, extract_json_object


def _nutrient(name, value, unit):
    return {"nutrientName": name, "value": value, "unitName": unit}


class TestExtractMacrosFromUsda:
    def test_reads_kcal_not_kilojoules(self):
        # USDA often lists Energy twice; we must take kcal, not the ~4.18x larger kJ value (C2).
        food = {
            "foodNutrients": [
                _nutrient("Energy", 869, "kJ"),
                _nutrient("Energy", 208, "kcal"),
                _nutrient("Protein", 20.4, "g"),
                _nutrient("Total lipid (fat)", 13.4, "g"),
                _nutrient("Carbohydrate, by difference", 0, "g"),
            ]
        }
        macros = extract_macros_from_usda(food)
        assert macros["calories"] == 208
        assert macros["protein_g"] == 20.4
        assert macros["fat_g"] == 13.4

    def test_ignores_energy_when_only_kilojoules_present(self):
        food = {"foodNutrients": [_nutrient("Energy", 869, "kJ"), _nutrient("Protein", 20, "g")]}
        macros = extract_macros_from_usda(food)
        assert macros["calories"] == 0
        assert macros["protein_g"] == 20

    def test_returns_none_when_no_calories_or_protein(self):
        food = {"foodNutrients": [_nutrient("Total lipid (fat)", 0, "g")]}
        assert extract_macros_from_usda(food) is None

    def test_handles_missing_or_bad_values(self):
        food = {"foodNutrients": [_nutrient("Energy", None, "kcal"), _nutrient("Protein", "x", "g")]}
        assert extract_macros_from_usda(food) is None


class TestExtractJsonObject:
    def test_plain_json(self):
        assert extract_json_object('{"name": "eggs", "price": 4.99}') == {"name": "eggs", "price": 4.99}

    def test_strips_code_fence(self):
        content = '```json\n{"name": "rice", "weight": 5}\n```'
        assert extract_json_object(content) == {"name": "rice", "weight": 5}

    def test_strips_bare_fence(self):
        assert extract_json_object('```\n{"a": 1}\n```') == {"a": 1}

    def test_extracts_json_from_surrounding_prose(self):
        content = 'Sure! Here is the result: {"name": "oats", "price": 3} — hope that helps.'
        assert extract_json_object(content) == {"name": "oats", "price": 3}

    def test_raises_on_empty(self):
        with pytest.raises(ValueError):
            extract_json_object("")

    def test_raises_on_unparseable(self):
        with pytest.raises(Exception):
            extract_json_object("no json here at all")
