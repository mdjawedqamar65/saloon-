import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


// ==========================================
// CONFIGURATION
// ==========================================

// Razorpay LIVE Public Key
const RAZORPAY_KEY_ID = "h";

// Cloudflare Worker URL
const PAYMENT_API = "https://sohana-payment.mdjawedqamar65.workers.dev/";


// ==========================================
// MOBILE MENU
// ==========================================

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
  menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("active");
    });
  });
}


// ==========================================
// BOOKING DATE
// ==========================================

const dateInput = document.getElementById("date");

if (dateInput) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

  dateInput.min = today.toISOString().split("T")[0];
}


// ==========================================
// BOOKING + RAZORPAY PAYMENT
// ==========================================

const bookingForm = document.getElementById("bookingForm");
const formMessage = document.getElementById("formMessage");

if (bookingForm) {

  bookingForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const submitButton = document.getElementById("paymentButton");

    const nameInput = document.getElementById("name");
    const phoneInput = document.getElementById("phone");
    const serviceSelect = document.getElementById("service");
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    const messageInput = document.getElementById("message");


    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const amount = Number(serviceSelect.value);
    const date = dateInput.value;
    const time = timeInput.value;
    const message = messageInput.value.trim();


    // Selected service name
    const selectedOption =
      serviceSelect.options[serviceSelect.selectedIndex];

    const serviceName =
      selectedOption.dataset.name ||
      selectedOption.textContent.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !phone || !amount || !date || !time) {

      formMessage.style.color = "red";
      formMessage.textContent =
        "Please fill all required details.";

      return;
    }


    // Check Razorpay script
    if (typeof window.Razorpay === "undefined") {

      formMessage.style.color = "red";
      formMessage.textContent =
        "Razorpay could not load. Please refresh the page and try again.";

      return;
    }


    try {

      // Button loading
      submitButton.disabled = true;
      submitButton.textContent = "CREATING PAYMENT...";

      formMessage.style.color = "#333";
      formMessage.textContent =
        "Creating secure payment order...";


      // ==========================================
      // CREATE RAZORPAY ORDER FROM CLOUDFLARE
      // ==========================================

      console.log("Creating payment order...");
      console.log("Amount:", amount);


      const response = await fetch(PAYMENT_API, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          amount: amount
        })

      });


      // Get response safely
      const responseText = await response.text();

      console.log("Worker Status:", response.status);
      console.log("Worker Response:", responseText);


      let data;

      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {

        throw new Error(
          "Invalid response received from payment server: " +
          responseText
        );

      }


      // ==========================================
      // CHECK ORDER RESPONSE
      // ==========================================

      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error?.description ||
          "Server returned error " + response.status
        );

      }


      if (!data.success) {

        throw new Error(
          data.message ||
          data.error?.description ||
          "Payment order could not be created."
        );

      }


      if (!data.order) {

        throw new Error(
          "Payment order missing from server response."
        );

      }


      if (!data.order.id) {

        throw new Error(
          "Razorpay order ID was not received."
        );

      }


      console.log("Razorpay Order Created:", data.order);


      // ==========================================
      // RAZORPAY OPTIONS
      // ==========================================

      const options = {

        key: RAZORPAY_KEY_ID,

        amount: data.order.amount,

        currency: data.order.currency || "INR",

        name: "Sohana Beauty Saloon",

        description: serviceName,

        order_id: data.order.id,


        prefill: {

          name: name,

          contact: phone

        },


        notes: {

          customer_name: name,

          customer_phone: phone,

          service: serviceName,

          appointment_date: date,

          appointment_time: time,

          special_request: message

        },


        theme: {
          color: "#000000"
        },


        // ==========================================
        // PAYMENT SUCCESS
        // ==========================================

        handler: async function (paymentResponse) {

          console.log(
            "Payment Successful:",
            paymentResponse
          );


          try {

            submitButton.disabled = true;
            submitButton.textContent = "SAVING BOOKING...";

            formMessage.style.color = "#333";
            formMessage.textContent =
              "Payment successful. Saving your appointment...";


            // ==========================================
            // SAVE BOOKING ONLY AFTER PAYMENT SUCCESS
            // ==========================================

            await addDoc(
              collection(db, "bookings"),
              {

                name: name,

                phone: phone,

                service: serviceName,

                amount: amount,

                date: date,

                time: time,

                message: message,

                status: "pending",

                paymentStatus: "paid",

                razorpayPaymentId:
                  paymentResponse.razorpay_payment_id || "",

                razorpayOrderId:
                  paymentResponse.razorpay_order_id || data.order.id,

                razorpaySignature:
                  paymentResponse.razorpay_signature || "",

                createdAt: serverTimestamp()

              }
            );


            // Success message
            formMessage.style.color = "green";

            formMessage.textContent =
              "Payment successful! Your appointment has been booked. ✨";


            bookingForm.reset();


            alert(
              "Payment Successful! Your appointment has been booked."
            );


          } catch (error) {

            console.error(
              "Firebase Save Error:",
              error
            );


            formMessage.style.color = "red";

            formMessage.textContent =
              "Payment was successful, but appointment could not be saved. Please contact the salon.";

          } finally {

            submitButton.disabled = false;

            submitButton.textContent =
              "BOOK & PAY NOW";

          }

        },


        // ==========================================
        // PAYMENT FAILED
        // ==========================================

        modal: {

          ondismiss: function () {

            console.log("Payment popup closed");

            submitButton.disabled = false;

            submitButton.textContent =
              "BOOK & PAY NOW";


            if (
              !formMessage.textContent.includes(
                "Payment successful"
              )
            ) {

              formMessage.style.color = "#b8860b";

              formMessage.textContent =
                "Payment was cancelled.";

            }

          }

        }

      };


      // ==========================================
      // OPEN RAZORPAY
      // ==========================================

      console.log("Opening Razorpay checkout...");

      const razorpay = new Razorpay(options);

      razorpay.on("payment.failed", function (response) {

        console.error(
          "Payment Failed:",
          response.error
        );


        formMessage.style.color = "red";

        formMessage.textContent =
          "Payment failed: " +
          (
            response.error.description ||
            "Please try again."
          );


        submitButton.disabled = false;

        submitButton.textContent =
          "BOOK & PAY NOW";

      });


      razorpay.open();


    } catch (error) {

      console.error(
        "PAYMENT ERROR:",
        error
      );


      formMessage.style.color = "red";

      formMessage.textContent =
        "Payment Error: " + error.message;


      submitButton.disabled = false;

      submitButton.textContent =
        "BOOK & PAY NOW";

    }

  });

}


// ==========================================
// CHECK BOOKING STATUS
// ==========================================

const statusForm = document.getElementById("statusForm");

const statusPhone =
  document.getElementById("statusPhone");

const statusResult =
  document.getElementById("statusResult");


if (statusForm && statusPhone && statusResult) {

  statusForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const phone =
        statusPhone.value.trim();


      // ==========================================
      // PHONE VALIDATION
      // ==========================================

      if (!phone) {

        statusResult.innerHTML = `
          <p style="
            color:red;
            margin-top:15px;
            text-align:center;
          ">
            Please enter your phone number.
          </p>
        `;

        return;

      }


      // Loading
      statusResult.innerHTML = `
        <p style="
          margin-top:20px;
          text-align:center;
        ">
          Checking your booking...
        </p>
      `;


      try {

        const bookingsRef =
          collection(db, "bookings");


        const q = query(
          bookingsRef,
          where("phone", "==", phone)
        );


        const querySnapshot =
          await getDocs(q);


        // ==========================================
        // NO BOOKING
        // ==========================================

        if (querySnapshot.empty) {

          statusResult.innerHTML = `
            <div style="
              margin-top:20px;
              padding:20px;
              text-align:center;
              border:1px solid #e8ddd0;
            ">

              <h3>No Booking Found</h3>

              <p>
                Please enter the same phone number
                used while booking.
              </p>

            </div>
          `;

          return;

        }


        // Get booking
        let booking = null;

        querySnapshot.forEach(
          (bookingDoc) => {

            booking = bookingDoc.data();

          }
        );


        // ==========================================
        // BOOKING STATUS
        // ==========================================

        const status =
          String(
            booking.status || "pending"
          ).toLowerCase();


        let statusText =
          "🟡 PENDING";

        let statusColor =
          "#b8860b";


        if (status === "approved") {

          statusText =
            "🟢 APPROVED";

          statusColor =
            "green";

        } else if (status === "cancelled") {

          statusText =
            "🔴 CANCELLED";

          statusColor =
            "red";

        }


        // ==========================================
        // PAYMENT STATUS
        // ==========================================

        const paymentText =
          booking.paymentStatus === "paid"
            ? "✅ PAID"
            : "⏳ PENDING";


        // ==========================================
        // SHOW RESULT
        // ==========================================

        statusResult.innerHTML = `
          <div style="
            margin-top:20px;
            padding:20px;
            background:#ffffff;
            border:1px solid #e8ddd0;
            text-align:center;
          ">

            <h3 style="
              margin-bottom:15px;
            ">
              ${booking.name || "Customer"}
            </h3>


            <p>
              <strong>Service:</strong>
              ${booking.service || "-"}
            </p>


            <p>
              <strong>Amount:</strong>
              ₹${booking.amount || "-"}
            </p>


            <p>
              <strong>Date:</strong>
              ${booking.date || "-"}
            </p>


            <p>
              <strong>Time:</strong>
              ${booking.time || "-"}
            </p>


            <p>
              <strong>Payment:</strong>
              ${paymentText}
            </p>


            <h3 style="
              color:${statusColor};
              margin-top:20px;
            ">
              ${statusText}
            </h3>

          </div>
        `;


      } catch (error) {

        console.error(
          "STATUS CHECK ERROR:",
          error
        );


        statusResult.innerHTML = `
          <div style="
            margin-top:20px;
            padding:15px;
            color:red;
            text-align:center;
          ">
            Error: ${error.message}
          </div>
        `;

      }

    }
  );

}
