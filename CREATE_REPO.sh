#!/bin/bash

# This script creates the GitHub repo and pushes the code

echo "Creating GitHub repository..."
gh repo create ct-gaming-directory --public --description "Connecticut Gaming Store Directory - Find local game stores, play spaces, and tournaments" --source=. --remote=origin --push

echo "Repository created! Opening in browser..."
gh repo view --web

echo "Done! Your repo is at: https://github.com/builtbytom/ct-gaming-directory"