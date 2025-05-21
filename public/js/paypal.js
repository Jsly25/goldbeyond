window.paypal
  .Buttons({
    style: {
      shape: "rect",
      layout: "vertical",
      color: "blue",
      label: "paypal",
    },

    // Create an order
    async createOrder() {
      try {
        // Retrieve cart products from the hidden input
        let cartProducts = document.getElementById("cartProducts").value;
        cartProducts = JSON.parse(cartProducts); // Parse the cart JSON to a JavaScript object

        console.log("Cart Products:", cartProducts);

        // Send a POST request to your backend to create the order
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cart: cartProducts }), // Pass the cart data
        });

        // Check for a successful response
        if (!response.ok) {
          throw new Error(`Failed to create order: ${response.statusText}`);
        }

        const orderData = await response.json();

        // Ensure the backend returns an order ID
        if (orderData.id) {
          console.log("Order Data:", orderData);
          return orderData.id; // Return the order ID to PayPal
        }

        throw new Error("Order ID not returned in response");
      } catch (error) {
        console.error("Error creating order:", error);
        alert("An error occurred while creating the order. Please try again.");
        throw error; // Rethrow to ensure PayPal handles it properly
      }
    },

    // Approve and capture the order
    async onApprove(data, actions) {
      try {
        console.log("Order approved, capturing payment...");

        // Send a POST request to your backend to capture the order
        const response = await fetch(`/api/orders/${data.orderID}/capture`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Check for a successful response
        if (!response.ok) {
          throw new Error(`Failed to capture order: ${response.statusText}`);
        }

        const orderData = await response.json();
        console.log("Order Captured:", orderData);

        // Extract transaction details
        const transaction =
          orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
          orderData?.purchase_units?.[0]?.payments?.authorizations?.[0];

        if (!transaction) {
          throw new Error("Transaction data is missing");
        }

        console.log("Transaction:", transaction);

        // Redirect to the invoice or confirmation page
        window.location.href = `/checkout/Paypal/${data.orderID}/${transaction.id}`;
      } catch (error) {
        console.error("Error capturing order:", error);
        alert("An error occurred while capturing the payment. Please try again.");
      }
    },
  })
  .render("#paypal-button-container"); // Renders the PayPal button
