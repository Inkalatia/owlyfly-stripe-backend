const path = require('path');
const express = require('express');
const Stripe = require('stripe');
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); //|| 'sk_test_51QV1GQFTxUtP1E0qXgWALeObPMxehMmlNRoN1ZclaKuzYPflpqS78imiTN1hwshmFGqNkx11a9c9z0R3fm771ZEg00eBR4h5oP');
const SUCCESS_URL = 'https://owly.byethost7.com/success.html'; // Mirror premium flow
const CANCEL_URL = 'https://owly.byethost7.com/cancel.html';

// ======== SHOP ITEMS CONFIGURATION ========
const SHOP_ITEMS = {
  // Skins this is for live
  'owlyfly.skin_ww1plane': { 
    name: 'WW1 Plane Skin',
    stripe_product_id: 'prod_S68icdsXWtqVA6',
    stripe_price_id: 'price_1RBwRBFTxUtP1E0qPYX0ZUck'
  },
  'owlyfly.skin_eagle': {
    name: 'Eagle Skin',
    stripe_product_id: 'prod_S68lwNuhrL3XJt',
    stripe_price_id: 'price_1RBwTnFTxUtP1E0qWw2ZaRxZ'
  },
  'owlyfly.skin_dragon1': {
    name: 'Red Dragon Skin',
    stripe_product_id: 'prod_S68mTarLPzfISA',
    stripe_price_id: 'price_1RBwVEFTxUtP1E0qQy7c0MUd'
  },
  'owlyfly.skin_bat': {
    name: 'Emeral Bat Skin',
    stripe_product_id: 'prod_S68n5TwE8T6xbw',
    stripe_price_id: 'price_1RBwVyFTxUtP1E0q5jV1k1G8'
  },
  'owlyfly.skin_dragon2': {
    name: 'Black Dragon Skin',
    stripe_product_id: 'prod_S68oCC2HJti68B',
    stripe_price_id: 'price_1RBwWkFTxUtP1E0qOiu8ViBu'
  },
  
  // Landscapes
  'owlyfly.landscape_cathedral':  {
    name: 'Cathedral Landscape',
    stripe_product_id: 'prod_S6DLJyHYhdXCBM',
    stripe_price_id: 'price_1RC0v7FTxUtP1E0qKj9qw6vt'
  },
  'owlyfly.landscape_city2': {
    name: 'City Landscape',
    stripe_product_id: 'prod_S6DM00buJoxRiJ',
    stripe_price_id: 'price_1RC0vhFTxUtP1E0qGaWGtkk9'
  },
  'owlyfly.landscape_winter': {
    name: 'Old Town Landscape',
    stripe_product_id: 'prod_S6DNQBwqy4pPJg',
    stripe_price_id: 'price_1RC0wXFTxUtP1E0qmJOnQ08h'
  },
};

const SHOP_ITEMS2 = {
  // Skins THIS IS ALL TEST MODE
  'owlyfly.skin_ww1plane': { 
    name: 'WW1 Plane Skin',
    stripe_product_id: 'prod_S6XctFEh2pFZ0G',
    stripe_price_id: 'price_1RCKXeFTxUtP1E0qVMUiaGzb'
  },
  'owlyfly.skin_eagle': {
    name: 'Eagle Skin',
    stripe_product_id: 'prod_S6XetuLM6zFvaW',
    stripe_price_id: 'price_1RCKZ4FTxUtP1E0qqvr7ioH1'
  },
  'owlyfly.skin_dragon1': {
    name: 'Red Dragon Skin',
    stripe_product_id: 'prod_S6Xfg0BAIsMBDI',
    stripe_price_id: 'price_1RCKaBFTxUtP1E0qiKKhDyGX'
  },
  'owlyfly.skin_bat': {
    name: 'Emerald Bat Skin',
    stripe_product_id: 'prod_S6XhQEQhb06EJW',
    stripe_price_id: 'price_1RCKc4FTxUtP1E0qxkV22siW'
  },
  'owlyfly.skin_dragon2': {
    name: 'Black Dragon Skin',
    stripe_product_id: 'prod_S6XiGHImpT2ywJ',
    stripe_price_id: 'price_1RCKd7FTxUtP1E0qAYKMv9VC'
  },
  
  // Landscapes
  'owlyfly.landscape_cathedral':  {
    name: 'Cathedral Landscape',
    stripe_product_id: 'prod_S6XjZsQj4Z8tLk',
    stripe_price_id: 'price_1RCKeIFTxUtP1E0qcCIs226C'
  },
  'owlyfly.landscape_city2': {
    name: 'City Landscape',
    stripe_product_id: 'prod_S6XlARLgfAi4h5',
    stripe_price_id: 'price_1RCKfZFTxUtP1E0qfhdgeGxI'
  },
  'owlyfly.landscape_winter': {
    name: 'Old Town Landscape',
    stripe_product_id: 'prod_S6XmF4FkAmmjLX',
    stripe_price_id: 'price_1RCKgiFTxUtP1E0q3F5PA2eK'
  },
};
// ======== END OF SHOP CONFIG ========

// Middleware to parse JSON
app.use(express.json());

// Enable CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// Add health check endpoint (REQUIRED by Cyclic)
app.get('/', (req, res) => {
  res.send('OwlyFly Stripe Backend Online');
});

// Endpoint to create a Checkout Session
app.post('/create_checkout_session', async (req, res) => {
    try {
        // Log the incoming request body for debugging
        console.log("Received request body:", req.body);

        // Extract the email from the request body (if provided)
        const { email } = req.body;

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['wechat_pay', 'card'], // Supported payment methods
            line_items: [
                {
                    price_data: {
                        currency: 'cny', // Chinese Yuan
                        product_data: {
                            name: 'Owly Fly! Premium', // Product name
                        },
                        unit_amount: 3000, // 30 RMB in fen (1 RMB = 100 fen)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // One-time payment
            success_url: `https://inkalatia.github.io/success/success.html?payment=success&email=${encodeURIComponent(email)}`,
            cancel_url: 'https://inkalatia.github.io/cancel/cancel.html', // Redirect URL if payment is canceled
            customer_email: email, // Prefill the email field in the Stripe Checkout form
            payment_intent_data: {
                description: 'OwlyFly 高级版', // Prefill the name field
                metadata: {
                    product_id: 'prod_Rse8IiTZ6IEgar', // Your product ID
                    price_id: 'price_1QysqMFTxUtP1E0qG8zBGzaU', // Your price ID
                },
            },
            payment_method_options: {
                wechat_pay: {
                    client: 'web', // Required for WeChat Pay
                },
            },
            metadata: {
                product_id: 'prod_Rse8IiTZ6IEgar', // Your product ID
                price_id: 'price_1QysqMFTxUtP1E0qG8zBGzaU', // Your price ID
            },
        });

        // Send the Checkout Session URL to the client
        res.send({ url: session.url });
    } catch (error) {
        // Log the error and send a 500 response
        console.error("Error creating checkout session:", error.message);
        res.status(500).send({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// ======== SHOP ENDPOINTS ========
app.post('/create_shop_session', async (req, res) => {
  try {
    const { product_id, email } = req.body;
    
    if (!SHOP_ITEMS[product_id]) {
      return res.status(400).send({ error: 'Invalid product ID' });
    }

    const product = SHOP_ITEMS[product_id];
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['wechat_pay', 'card'],
      payment_method_options: {
        wechat_pay: {
          client: 'web' // Required for WeChat Pay
        }
      },
      line_items: [{
        price: product.stripe_price_id,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}&product_id=${product_id}&email=${encodeURIComponent(email)}`,
      cancel_url: CANCEL_URL,
      customer_email: email,
      payment_intent_data: {
        description: `Purchase: ${product.name}`,
        metadata: {
          product_id: product.stripe_product_id,
          internal_product_id: product_id,
          price_id: product.stripe_price_id
        }
      },
      metadata: {
        product_id: product.stripe_product_id,
        internal_product_id: product_id,
        price_id: product.stripe_price_id
      }
    });

    res.send({ url: session.url });
  } catch (error) {
        // Log the error and send a 500 response
        console.error("Error creating checkout session:", error.message);
        res.status(500).send({ error: error.message });
    }
});
// Updated verify_shop_purchase endpoint
app.post('/verify_shop_purchase', async (req, res) => {
    try {
        const { product_id, email } = req.body;

        // Step 1: Check if there's a customer with this email
        const customers = await stripe.customers.list({
            email: email,
            limit: 1,
        });

        let isPurchased = false;

        if (customers.data.length > 0) {
            // Step 2: Check customer's charges
            const customer = customers.data[0];
            const charges = await stripe.charges.list({
                customer: customer.id,
                limit: 100,
            });

            isPurchased = charges.data.some(charge => 
                charge.metadata.internal_product_id === product_id &&
                charge.status === 'succeeded'
            );
        }

        // Step 3: Check all charges if not found via customer
        if (!isPurchased) {
            const charges = await stripe.charges.list({
                limit: 100,
            });

            isPurchased = charges.data.some(charge => 
                charge.billing_details.email === email &&
                charge.metadata.internal_product_id === product_id &&
                charge.status === 'succeeded'
            );
        }

        res.send({ valid: isPurchased });
    } catch (error) {
        console.error("Verification error:", error);
        res.status(500).send({ 
            error: error.message,
            code: error.type || 'server_error'
        });
    }
});