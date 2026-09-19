export const config={
 walletUrl:'https://sphere.unicity.network',
 coinId:'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0',
 decimals:18,
 deposit:5,
 attempts:20,
 poolShare:0.5,
 treasury:process.env.NEXT_PUBLIC_SPHERE_TREASURY_ADDRESS||''
};
