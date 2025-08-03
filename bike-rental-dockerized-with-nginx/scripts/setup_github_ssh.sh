#!/bin/bash

# Step 1: Generate a new SSH key
echo "📌 Generating SSH key..."
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519 -N ""

# Step 2: Start the ssh-agent
echo "📌 Starting ssh-agent..."
eval "$(ssh-agent -s)"

# Step 3: Add the SSH private key to the agent
ssh-add ~/.ssh/id_ed25519

# Step 4: Print the public key to copy manually
echo "✅ SSH key generated. Copy the key below and add it to your GitHub SSH settings:"
echo "🔑 Public key:"
echo "------------------------------------------------------------"
cat ~/.ssh/id_ed25519.pub
echo "------------------------------------------------------------"
echo ""
echo "📌 Go to https://github.com/settings/keys → New SSH key → Paste the above content"
echo "🔁 After adding the key, run the following to test:"
echo ""
echo "ssh -T git@github.com"
echo ""
echo "✅ Then push to your repo:"
echo "git push -u origin main"