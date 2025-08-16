const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); //|| 'sk_test_51QV1GQFTxUtP1E0qXgWALeObPMxehMmlNRoN1ZclaKuzYPflpqS78imiTN1hwshmFGqNkx11a9c9z0R3fm771ZEg00eBR4h5oP');
const SUCCESS_URL = 'https://owly.byethost7.com/success.html'; // Mirror premium flow
const axios = require('axios');
const PREMIUM_PRODUCT_ID = 'prod_Rse8IiTZ6IEgar';
const GODOT_SERVER_PORT = 8080; // Match Godot's local port
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

// ======================
// WEBHOOK CONFIGURATION
// ======================
app.post('/webhook', 
    bodyParser.raw({ type: 'application/json' }),
    async (req, res) => {
        const sig = req.headers['stripe-signature'];
        
        try {
            const event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET
            );

            switch (event.type) {
                case 'checkout.session.completed':
                    const session = event.data.object;
                    console.log('✅ Payment succeeded:', session.id);

                    // Extract customer details
                    const email = session.customer_details?.email;
                    if (!email) throw new Error('No email in session');

                    // Handle customer association
                    const customer = await handleCustomerCreation(
                        email,
                        session.customer_details?.name
                    );

                    // Update payment intent with customer ID
                    if (session.payment_intent) {
                        await stripe.paymentIntents.update(session.payment_intent, {
                            customer: customer.id
                        });
                    }

                    // Notify Godot and finalize
                    await activatePremiumFeatures(email);
                    break;

                default:
                    console.log(`⚠️ Unhandled event: ${event.type}`);
            }

            res.status(200).json({ received: true });

        } catch (err) {
            console.error('❌ Webhook Error:', err.message);
            res.status(400).send(`Webhook Error: ${err.message}`);
        }
    }
);


// Middleware to parse JSON
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


// Add health check endpoint 
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

// ======================
// PREMIUM STATUS CHECK
// ======================
app.post('/check_premium_status', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new Error('Email required');
    const hasPremium = await checkPremiumStatus(email);
    res.send({ premium: hasPremium });
  } catch (error) {
    console.error("Premium Check Failed:", error.message);
    res.status(500).send({ error: error.message });
  }
});

// ======================
// HELPER FUNCTIONS
// ======================
async function handleCustomerCreation(email, name) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    return existing.data[0] || await stripe.customers.create({ email, name });
}

async function checkPremiumStatus(email) {
    // Check charges directly associated with customers
    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
        const customerCharges = await stripe.charges.list({
            customer: customers.data[0].id,
            limit: 100
        });
        if (customerCharges.data.some(isValidCharge)) return true;
    }

    // Check charges with matching email
    const allCharges = await stripe.charges.list({ limit: 100 });
    return allCharges.data.some(charge => 
        charge.billing_details?.email === email && isValidCharge(charge)
    );
}

function isValidCharge(charge) {
    return charge.status === 'succeeded' && 
           charge.metadata.product_id === PREMIUM_PRODUCT_ID;
}

async function activatePremiumFeatures(email) {
    try {
        console.log(`🎉 Activating premium for: ${email}`);
        // Notify Godot game via local server
        await axios.get(`http://localhost:${GODOT_SERVER_PORT}`, {
            params: { email }
        });
    } catch (error) {
        console.error('⚠️ Failed to notify Godot:', error.message);
        // Implement retry logic here if needed
    }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
