# Parses a .env file and generates a template

# FILE FORMAT:
"""
# //--------------------
# // HEADER
# //--------------------

# KEY - DESC - [DEFAULT: DEFAULT_VAL]
KEY=VAL
"""

import re

TEMPLATE = []
with open(".env", "r") as f:
    CONTENT = f.readlines()

DEFAULT = ""
for line in CONTENT:
    if line.startswith("# //"):
        TEMPLATE += line
    elif line.startswith("#"):
        TEMPLATE += line
        if re.search(r"\[DEFAULT: (.+)\]", line):
            DEFAULT = re.search(r"\[DEFAULT: (.+)\]", line).group(1).replace("NONE", '""')
    elif re.search(r"(.+)=(.+)", line):
        match = re.search(r"(.+)=(.+)", line)
        TEMPLATE += f"{match.group(1)}={DEFAULT}\n"
    else:
        TEMPLATE += "\n"
            

with open(".env.template", "w") as f:
    f.writelines(TEMPLATE)