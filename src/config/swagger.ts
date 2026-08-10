import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "AutoParts Express API",
      version: "1.0.0",
      description:
        "Production-tier automotive parts e-commerce API. Google OAuth auth, catalog, fitment, cart, orders, and admin operations.",
      contact: { name: "AutoParts Express" },
      license: { name: "Proprietary" },
    },
    servers: [{ url: "http://localhost:5000", description: "Local development" }],
    tags: [
      { name: "Health", description: "Service health checks" },
      { name: "Auth", description: "Google OAuth authentication" },
      { name: "Users", description: "Profile and garage vehicles" },
      { name: "Vehicles", description: "VIN decoding" },
      { name: "Catalog", description: "Categories and parts" },
      { name: "Reviews", description: "Part reviews" },
      { name: "Diagrams", description: "Interactive schematics" },
      { name: "Maintenance", description: "Maintenance schedule planner" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Order placement and history" },
      { name: "Webhooks", description: "Stripe event callbacks" },
      { name: "Admin", description: "Administrative operations" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT access token issued after Google OAuth sign-in (httpOnly cookie).",
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ["./src/routes/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
