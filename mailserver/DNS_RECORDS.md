# DNS Records Configuration

This document contains the DNS records you need to configure when moving to production with a real domain.

## Prerequisites

Before configuring DNS records, you need:
1. A registered domain (e.g., `pilot180.com`)
2. Access to your domain's DNS management panel
3. A server with a public IP address

## DNS Records to Add

Replace `pilot180.com` with your actual domain and `YOUR_SERVER_IP` with your server's public IP address.

### 1. A Record (Mail Server)

Points your mail subdomain to your server.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **A** | `mail` | `YOUR_SERVER_IP` | 3600 |

Example:
```
mail.pilot180.com → 203.0.113.42
```

### 2. MX Record (Mail Exchange)

Tells other mail servers where to deliver mail for your domain.

| Type | Name | Value | Priority | TTL |
|------|------|-------|----------|-----|
| **MX** | `@` | `mail.pilot180.com` | 10 | 3600 |

Example:
```
pilot180.com MX 10 mail.pilot180.com
```

### 3. SPF Record (Sender Policy Framework)

Specifies which servers are allowed to send email from your domain.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **TXT** | `@` | `v=spf1 mx a ip4:YOUR_SERVER_IP ~all` | 3600 |

Example:
```
v=spf1 mx a ip4:203.0.113.42 ~all
```

**SPF Explanation:**
- `v=spf1` - SPF version 1
- `mx` - Allow servers listed in MX records
- `a` - Allow A record IPs
- `ip4:YOUR_SERVER_IP` - Explicitly allow your mail server IP
- `~all` - Soft fail for all other servers (use `-all` for hard fail in production)

### 4. DKIM Record (DomainKeys Identified Mail)

Cryptographically signs your outgoing emails.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **TXT** | `mail._domainkey` | See below | 3600 |

**DKIM Public Key Value:**

```
v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi9TwE++D3wOf9d25dtpN9+KyKbp64T7LsRgpVyjqpEQWvU6ItQL4qvu8Bv9Z94xiGC36cNiWpGBzeL4JzCIopVv+DRAAvBODEcA/a1p0bE+yS7PX03FOO7W9uezTSSRywSbzGqt/y5CWhtALz2aiFHC9TX7NJrqLkASsuHtkEpiraQ/5AF99/MHtBI6u4FEUbFfW/KqcuHmfXD0mI/B6V3UTDzxgSrFMnQg/wiwvoQE4MkfPAkJYN/KmWJCjNxM0UfWyzJAYPbAqSn6nCIkrdIPIzk3fzU2iXGZDshcCTWC2eSFkPIXozVdOGAr2Y/RZatwAsktFjpROsqYbxv/FlwIDAQAB
```

**Important:** Some DNS providers have character limits. If your provider splits long TXT records, that's normal. The key should be entered as one continuous string without line breaks.

### 5. DMARC Record (Domain-based Message Authentication)

Instructs receiving servers how to handle messages that fail SPF/DKIM checks.

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@pilot180.com` | 3600 |

Example:
```
v=DMARC1; p=none; rua=mailto:dmarc@pilot180.com
```

**DMARC Policies:**
- `p=none` - Monitor only (recommended for testing)
- `p=quarantine` - Mark suspicious emails as spam
- `p=reject` - Reject emails that fail authentication (production)

**DMARC Options:**
- `rua=mailto:email@domain.com` - Send aggregate reports
- `ruf=mailto:email@domain.com` - Send forensic reports
- `pct=100` - Apply policy to 100% of messages

## Complete DNS Configuration Example

For domain `pilot180.com` with server IP `203.0.113.42`:

```dns
# A Record
mail.pilot180.com.    IN  A     203.0.113.42

# MX Record
pilot180.com.         IN  MX    10 mail.pilot180.com.

# SPF Record
pilot180.com.         IN  TXT   "v=spf1 mx a ip4:203.0.113.42 ~all"

# DKIM Record
mail._domainkey.pilot180.com.  IN  TXT   "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi9TwE++D3wOf9d25dtpN9+KyKbp64T7LsRgpVyjqpEQWvU6ItQL4qvu8Bv9Z94xiGC36cNiWpGBzeL4JzCIopVv+DRAAvBODEcA/a1p0bE+yS7PX03FOO7W9uezTSSRywSbzGqt/y5CWhtALz2aiFHC9TX7NJrqLkASsuHtkEpiraQ/5AF99/MHtBI6u4FEUbFfW/KqcuHmfXD0mI/B6V3UTDzxgSrFMnQg/wiwvoQE4MkfPAkJYN/KmWJCjNxM0UfWyzJAYPbAqSn6nCIkrdIPIzk3fzU2iXGZDshcCTWC2eSFkPIXozVdOGAr2Y/RZatwAsktFjpROsqYbxv/FlwIDAQAB"

# DMARC Record
_dmarc.pilot180.com.  IN  TXT   "v=DMARC1; p=none; rua=mailto:dmarc@pilot180.com"
```

## Verification

### 1. Check DNS Propagation

Wait 5-60 minutes for DNS changes to propagate, then verify:

```bash
# Check A record
dig A mail.pilot180.com

# Check MX record
dig MX pilot180.com

# Check SPF record
dig TXT pilot180.com

# Check DKIM record
dig TXT mail._domainkey.pilot180.com

# Check DMARC record
dig TXT _dmarc.pilot180.com
```

### 2. Test Email Delivery

Send a test email to:
- Gmail account
- Outlook account
- https://www.mail-tester.com

### 3. Online Verification Tools

Use these tools to verify your configuration:
- https://mxtoolbox.com/SuperTool.aspx
- https://www.mail-tester.com
- https://dkimvalidator.com
- https://dmarcian.com/dmarc-inspector/

## DNS Provider-Specific Notes

### Cloudflare
- Disable "Proxy" (orange cloud) for mail A record
- DKIM records work fine, just paste the full value

### GoDaddy
- May need to split DKIM record into multiple TXT records
- Use quotes around TXT record values

### AWS Route 53
- Enter records without trailing dot (Route 53 adds it)
- DKIM record may need quotes

### Google Domains / Cloud DNS
- Very straightforward
- Paste DKIM key as-is

## Troubleshooting

### SPF "Too Many DNS Lookups"
If you have many includes in SPF (like third-party services), you might hit the 10 DNS lookup limit. Flatten your SPF record or use include strategically.

### DKIM Signature Verification Failed
1. Check that your public key matches the private key
2. Verify the selector name (`mail._domainkey`)
3. Ensure no line breaks in the public key

### DMARC Reports Not Received
1. Verify the email address in `rua=`
2. Check spam folder
3. Reports are sent daily, not immediately

### Emails Still Going to Spam
Even with proper DNS:
1. Start with low volume
2. Warm up your IP reputation
3. Ensure good email content (not spammy)
4. Ask recipients to whitelist your domain
5. Consider using a dedicated IP

## Security Best Practices

1. **Start with Soft Fail**
   - Use `~all` in SPF initially
   - Use `p=none` in DMARC initially
   - Monitor for false positives

2. **Gradually Tighten**
   - After 1-2 weeks, switch to `-all` in SPF
   - After monitoring, switch to `p=quarantine` or `p=reject`

3. **Rotate DKIM Keys**
   - Rotate keys annually
   - Keep old key active for 1 week after rotation

4. **Monitor DMARC Reports**
   - Set up `rua=` to receive reports
   - Use DMARC analysis tools

## Moving from pilot180.local to Production Domain

When ready to use a real domain:

1. Update `mailserver/config/postfix/main.cf`:
   ```
   mydomain = yourdomain.com
   myhostname = mail.yourdomain.com
   ```

2. Update `mailserver/config/opendkim/opendkim.conf`:
   ```
   Domain yourdomain.com
   ```

3. Update `mailserver/config/opendkim/KeyTable`:
   ```
   mail._domainkey.yourdomain.com yourdomain.com:mail:/etc/opendkim/keys/yourdomain.com/mail.private
   ```

4. Update `mailserver/config/opendkim/SigningTable`:
   ```
   *@yourdomain.com mail._domainkey.yourdomain.com
   ```

5. Generate new DKIM keys for the new domain (optional but recommended)

6. Update DNS records with your provider

7. Restart services:
   ```bash
   cd mailserver
   docker compose restart
   ```

## Additional Resources

- [SPF Record Syntax](https://www.rfc-editor.org/rfc/rfc7208.html)
- [DKIM Specifications](https://www.rfc-editor.org/rfc/rfc6376.html)
- [DMARC Guide](https://dmarc.org/overview/)
- [Google Postmaster Tools](https://postmaster.google.com/)
- [Microsoft SNDS](https://sendersupport.olc.protection.outlook.com/snds/)

## Need Help?

If emails are being rejected:
1. Check server logs: `docker logs pilot180-postfix`
2. Check DKIM logs: `docker logs pilot180-opendkim`
3. Use mail-tester.com for detailed analysis
4. Verify all DNS records with dig commands above

---

**Generated**: $(date)
**Domain**: pilot180.local (development) → Replace with your domain
**DKIM Selector**: mail
**DKIM Key Location**: `config/opendkim/keys/pilot180.local/mail.public`
