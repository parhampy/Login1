import smtplib
import random
import string

# Function to generate a random code
def generate_code(length=6):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

# Function to send an email
def send_email(receiver, code):
    sender = "parhambahmani13@gmail.com"  # Sender's email
    password = "rcnp jqve hynw dhlu"  # Sender's email password

    subject = "your code "
    body = f"your code : {code}"

    message = f"Subject: {subject}\n\n{body}"

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()  # Enable TLS
            server.login(sender, password)
            server.sendmail(sender, receiver, message)
        print("ﺪﺷ ﻝﺎﺳﺭﺍ ﺎﻤﺷ ﯼﺍﺮﺑ ﺪﮐ")
    except Exception as e:
        print(f"Error sending email: {e}")

# Function to verify the code
def verify_code(correct_code):
    attempts = 3
    while attempts > 0:
        user_code = input("کد ارسال شده را وارد کنید== ")
        if user_code == correct_code:
            print("کد درست است خوش آمدید")
            return True
        else:
            attempts -= 1
            print(f"کد اشتباه هست. You have {attempts} attempts remaining.")
    print("You have run out of attempts. Please try again.")
    return False

# Main program execution
if __name__ == "__main__":
    receiver = input("ادرس ایمیل خود را وارد کنید == ")
    random_code = generate_code()
      # For testing purposes, remove this line in production
    send_email(receiver, random_code)
    verify_code(random_code)