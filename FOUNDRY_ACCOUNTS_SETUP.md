# 🔐 Foundry Accounts Setup Guide

This guide explains how to set up and use Foundry accounts for secure deployment of DreamLend contracts across multiple chains.

## 🌟 Why Use Foundry Accounts?

✅ **More Secure**: Private keys are encrypted and stored securely by Foundry  
✅ **No Environment Variables**: No need to expose private keys in `.env` files  
✅ **Better UX**: Cleaner command-line interface  
✅ **Industry Standard**: Follows best practices for smart contract deployment

## 🚀 Quick Start

### Step 1: Import Your Account

```bash
# Import your private key into Foundry (one-time setup)
forge account import develop --private-key <your-private-key>

# You'll be prompted to set a password for encryption
```

### Step 2: Verify Your Account

```bash
# List all imported accounts
forge account list

# Should show something like:
# develop (0xf6eE7B6F0170BE39A344f21241d5AD8b89960407)
```

### Step 3: Deploy to RISE Testnet

```bash
# Deploy to RISE testnet using your account
./scripts/deploy-rise-complete.sh rise develop 0xf6eE7B6F0170BE39A344f21241d5AD8b89960407
```

### Step 4: Deploy to Somnia Testnet

```bash
# Deploy to Somnia testnet using your account
./scripts/deploy-multi-chain.sh somnia develop 0xf6eE7B6F0170BE39A344f21241d5AD8b89960407
```

## 📋 Detailed Setup

### 1. Install Foundry (if not already installed)

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Import Your Wallet

```bash
# Option A: Import from private key
forge account import <account-name> --private-key <private-key>

# Option B: Import from keystore file
forge account import <account-name> --keystore <path-to-keystore>

# Option C: Import from mnemonic
forge account import <account-name> --mnemonic-path <path-to-mnemonic>
```

**Example:**

```bash
forge account import develop --private-key 0xabc123...def789
# Enter password when prompted (this encrypts your key)
```

### 3. Verify Setup

```bash
# List accounts
forge account list

# Should output:
# develop (0xf6eE7B6F0170BE39A344f21241d5AD8b89960407)
```

### 4. Get Your Address

You need your wallet address for the `--sender` parameter:

```bash
# Get address from private key (if you have it)
cast wallet address <private-key>

# Or check your wallet app/MetaMask for the address
```

## 🎯 Deployment Commands

### RISE Testnet (Complete Flow)

```bash
# Deploy tokens + main contracts to RISE testnet
./scripts/deploy-rise-complete.sh rise develop 0xYourWalletAddress
```

### Somnia Testnet

```bash
# Deploy to Somnia testnet (includes mock tokens)
./scripts/deploy-multi-chain.sh somnia develop 0xYourWalletAddress
```

### Both Chains

```bash
# Deploy to all supported chains
./scripts/deploy-multi-chain.sh all develop 0xYourWalletAddress
```

## 🔧 Command Structure

All deployment commands follow this pattern:

```bash
./script-name.sh [chain] [account-name] [sender-address]
```

Where:

- **chain**: `somnia`, `rise`, or `all`
- **account-name**: Your Foundry account name (e.g., `develop`)
- **sender-address**: Your wallet address (e.g., `0xf6eE7B6F0170BE39A344f21241d5AD8b89960407`)

## 🛡️ Security Best Practices

### ✅ Do:

- Use a dedicated testnet wallet for deployments
- Set a strong password when importing accounts
- Keep your account names descriptive but not sensitive
- Regularly back up your Foundry keystore

### ❌ Don't:

- Use your main wallet for testnet deployments
- Share your account passwords
- Store private keys in plain text files
- Use the same password for multiple accounts

## 📁 Account Storage

Foundry stores encrypted accounts in:

- **macOS**: `~/.foundry/keystores/`
- **Linux**: `~/.foundry/keystores/`
- **Windows**: `%USERPROFILE%\.foundry\keystores\`

## 🔄 Account Management

### List Accounts

```bash
forge account list
```

### Remove Account

```bash
forge account remove <account-name>
```

### Update Account Password

```bash
# Export and re-import with new password
forge account remove old-name
forge account import new-name --private-key <key>
```

## 🚨 Troubleshooting

### "Account not found"

```bash
# Check if account exists
forge account list

# Re-import if missing
forge account import develop --private-key <your-key>
```

### "Invalid sender address"

```bash
# Verify your address matches the account
cast wallet address <private-key>
```

### "Password incorrect"

```bash
# You'll be prompted for the password you set during import
# If forgotten, remove and re-import the account
```

### "RPC connection failed"

```bash
# Check network status:
# - RISE: https://status.testnet.risechain.com
# - Somnia: Check official channels
```

## 📞 Support

If you encounter issues:

1. **Check Prerequisites**: Ensure Foundry is installed and updated
2. **Verify Network**: Confirm testnet is operational
3. **Check Balance**: Ensure your wallet has testnet ETH
4. **Review Logs**: Check deployment output for specific errors

## 🎉 Next Steps

After successful deployment:

1. ✅ Update frontend configuration with deployed addresses
2. ✅ Test lending functionality on both chains
3. ✅ Verify contracts on block explorers
4. ✅ Update documentation with new addresses

---

**🔐 Remember**: Your account security is paramount. Never share private keys or account passwords!
