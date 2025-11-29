# SenseSpace Token Setup Guide

## Token Management

Manage your MiniApp API Tokens at: **[https://www.sensespace.xyz/miniapps/tokens](https://www.sensespace.xyz/miniapps/tokens)**

## Setup Instructions

1. **Copy the environment template:**
   ```bash
   cd server
   cp env.template .env
   ```

2. **Add your token to `server/.env`:**
   ```bash
   # Open server/.env in your editor
   # Add your token:
   SENSESPACE_MINIAPP_TOKEN=your_token_here
   ```

3. **Verify the token is working:**
   ```bash
   # Start the server
   cd server
   npm run dev
   
   # In another terminal, test the token endpoint
   curl http://localhost:3001/api/sensespace/token
   ```

## Security Notes

✅ **`.env` files are gitignored** - Your token will NOT be committed to git
✅ **Never commit tokens** - Always use environment variables
✅ **Use `env.template`** - This file is safe to commit (no secrets)

## Token Format

Your SenseSpace MiniApp token is a JWT (JSON Web Token) that looks like:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI...
```

This token authenticates your MiniApp with the SenseSpace API.

## Troubleshooting

- **Token not working?** Verify it's valid at [https://www.sensespace.xyz/miniapps/tokens](https://www.sensespace.xyz/miniapps/tokens)
- **Demo mode?** Leave `SENSESPACE_MINIAPP_TOKEN` empty to use mock data
- **Token expired?** Generate a new one from the token management page

