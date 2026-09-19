import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {title:'Geometry UCT Dash',description:'Sphere-connected Geometry Dash style runner on Unicity testnet2'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
