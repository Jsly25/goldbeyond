/*
Paypal keys
Note: 
- The keys are typically not stored here but in an .env file
- Replace the keys below with your own keys from paypal
*/
const PAYPAL_CLIENT_ID = "";
const PAYPAL_CLIENT_SECRET = "";
const BASE = "https://api-m.sandbox.paypal.com";

// export default async function generateAccessToken() {
async function generateAccessToken() {
    // To base64 encode your client id and secret
    const BASE64_ENCODED_CLIENT_ID_AND_SECRET = Buffer.from(
        `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
    ).toString("base64");

    const request = await fetch(
        "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${BASE64_ENCODED_CLIENT_ID_AND_SECRET}`,
            },
            body: new URLSearchParams({
                grant_type: "client_credentials",
                response_type: "id_token",
                intent: "sdk_init",
            }),
        }
    );
    const json = await request.json();
    return json.access_token;
}


async function handleResponse(response) {
    try {
        const jsonResponse = await response.json();
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}


/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (cart) => {
    // use the cart information passed from the front-end to calculate the purchase unit details

    // Dynamically process items for PayPal
    const processed_items = cart.map(item => ({
        name: item.ProductName,
        description: item.productDescription,
        unit_amount: {
            currency_code: "SGD",
            value: Number(item.Price).toFixed(2),
        },
        quantity: item.Quantity.toString(),
    }));

    // Calculate the total amount dynamically
    let total_amount = 0;
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        total_amount += item.Price * item.Quantity;
    }
    total_amount = total_amount.toFixed(2);

    console.log("processed items: ", processed_items)
    console.log(
        "shopping cart information passed from the frontend createOrder() callback:",
        cart
    );

    const accessToken = await generateAccessToken();
    console.log("Access Token: " + accessToken)

    const url = `${BASE}/v2/checkout/orders`;

    // Build the payload dynamically
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                items: processed_items,
                amount: {
                    currency_code: "SGD",
                    value: total_amount,
                    breakdown: {
                        item_total: {
                            currency_code: "SGD",
                            value: total_amount,
                        },
                    },
                },
            },
        ],
    };

    console.log(payload);

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
};


/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${BASE}/v2/checkout/orders/${orderID}/capture`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
    });

    return handleResponse(response);
};



exports.createOrderHandler  = async (req, res) => {
    try {
        console.log(req.body)

        console.log("inside create order method")    
        const { cart } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
};

exports.captureOrderHandler = async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);

        //Send status back to client waiting for approval
        res.status(httpStatusCode).json(jsonResponse);

    } catch (error) {
        console.error("Failed to capture order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
};
