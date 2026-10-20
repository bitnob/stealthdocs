"""Write a YAML copy of an OpenAPI JSON spec next to it.

Usage: python3 json-to-yaml.py path/to/spec.openapi.json
Writes path/to/spec.openapi.yaml with keys in the original order.
"""
import json
import sys

import yaml


class Dumper(yaml.SafeDumper):
    pass


def str_representer(dumper, value):
    style = "|" if "\n" in value else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", value, style=style)


Dumper.add_representer(str, str_representer)

src = sys.argv[1]
dest = src[: -len(".json")] + ".yaml"
with open(src) as f:
    spec = json.load(f)
with open(dest, "w") as f:
    yaml.dump(spec, f, Dumper=Dumper, sort_keys=False, allow_unicode=True, width=1000)
print(f"wrote {dest}")
