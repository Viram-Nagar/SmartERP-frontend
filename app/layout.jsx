import { Inter } from "next/font/google";
import "./globals.css";
// import { AuthProvider } from "@/context/AuthContext";
import { AuthProvider } from "@/context/AuthContext";
import { CompanyProvider } from "@/context/CompanyContext";
import { RoleProvider } from "@/context/RoleContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SmartERP",
  description: "Billing, Inventory & Accounting Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <CompanyProvider>
            <RoleProvider>{children}</RoleProvider>
          </CompanyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// import { Inter } from 'next/font/google';
// import './globals.css';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata = {
//   title: 'SmartERP',
//   description: 'Billing, Inventory & Accounting Management System',
// };

// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>{children}</body>
//     </html>
//   );
// }
