import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# by joshua 12/3/2025 protoype

receiver = sys.argv[1]
tracking = sys.argv[2]
new_status = sys.argv[3]
notes = sys.argv[4]

SENDER = "chivertonjoshua9@gmail.com"
PASSWORD = "egljuzesxkekohpq"

msg = MIMEMultipart()
msg['From'] = SENDER
msg['To'] = receiver
msg['Subject'] = f"KSAMC Application Update — {tracking}"

body = f"""
Your KSAMC application has been updated.

Tracking Number: {tracking}
New Status: {new_status}

Notes from reviewer:
{notes}

Regards,
KSAMC E-Portal
"""

msg.attach(MIMEText(body, 'plain'))

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(SENDER, PASSWORD)
    server.sendmail(SENDER, receiver, msg.as_string())
    server.quit()
    print("OK")
except Exception as e:
    print("ERROR:", str(e))
