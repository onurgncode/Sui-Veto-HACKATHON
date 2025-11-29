import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "@mysten/dapp-kit/dist/index.css";
import "@radix-ui/themes/styles.css";
import "./styles/liquid-glass.css";
import "./i18n/config";

import { SuiClientProvider, useSuiClientContext, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Theme } from "@radix-ui/themes";
import App from "./App.tsx";
import { networkConfig } from "./networkConfig.ts";
import { SuiClient } from "@mysten/sui/client";
import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';
import { ENOKI_CONFIG } from "./config/enoki";

const queryClient = new QueryClient();

const createClient = () => {
  const client = new SuiClient({
    url: "https://fullnode.testnet.sui.io:443",
  });
  console.log('[createClient] ✅ SuiClient created with URL:', client.url || "https://fullnode.testnet.sui.io:443");
  return client;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Theme appearance="dark">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider createClient={createClient} networks={networkConfig} defaultNetwork="testnet">
          <RegisterEnokiWallets />
          <WalletProvider autoConnect={false}>
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </React.StrictMode>,
);

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();
  useEffect(() => {
    console.log('[RegisterEnokiWallets] Network:', network);
    console.log('[RegisterEnokiWallets] Is Enoki Network:', isEnokiNetwork(network));
    console.log('[RegisterEnokiWallets] Client:', client);
    console.log('[RegisterEnokiWallets] Client URL:', client?.url || 'N/A');
    console.log('[RegisterEnokiWallets] Client Type:', client?.constructor?.name || 'Unknown');
    
    // Enoki'yi testnet ve devnet için her zaman register et
    // isEnokiNetwork kontrolü bazı durumlarda false dönebilir
    const shouldRegister = network === 'testnet' || network === 'devnet' || network === 'enoki-testnet' || isEnokiNetwork(network);
    
    if (shouldRegister && client) {
      console.log('[RegisterEnokiWallets] Registering Enoki wallets for network:', network);
      try {
        // Enoki için network'ü 'testnet' olarak kullan (Enoki testnet'i destekliyor)
        const enokiNetwork = network === 'testnet' || network === 'enoki-testnet' ? 'testnet' : network;
        
        // Client'ın url property'sini kontrol et
        const clientUrl = (client as any).url || (client as any).rpc?.url || 'https://fullnode.testnet.sui.io:443';
        console.log('[RegisterEnokiWallets] 🔍 Resolved Client URL:', clientUrl);
        
        const { unregister } = registerEnokiWallets({
          apiKey: ENOKI_CONFIG.apiKey,
          providers: {
            google: {
              clientId: ENOKI_CONFIG.googleClientId,
            },
          },
          client,
          network: enokiNetwork as any,
        });
        console.log('[RegisterEnokiWallets] ✅ Enoki wallets registered successfully for network:', enokiNetwork);
        console.log('[RegisterEnokiWallets] 🔍 Enoki API Key:', ENOKI_CONFIG.apiKey);
        console.log('[RegisterEnokiWallets] 🔍 Google Client ID:', ENOKI_CONFIG.googleClientId);
        console.log('[RegisterEnokiWallets] 🔍 Network:', enokiNetwork);
        console.log('[RegisterEnokiWallets] 🔍 Client URL:', clientUrl);
        return () => {
          console.log('[RegisterEnokiWallets] Unregistering Enoki wallets...');
          unregister();
        };
      } catch (error) {
        console.error('[RegisterEnokiWallets] ❌ Error registering Enoki wallets:', error);
        if (error instanceof Error) {
          console.error('[RegisterEnokiWallets] Error message:', error.message);
          console.error('[RegisterEnokiWallets] Error stack:', error.stack);
        }
      }
    } else {
      console.log('[RegisterEnokiWallets] ⚠️ Skipping Enoki registration:', {
        network,
        isEnokiNetwork: isEnokiNetwork(network),
        hasClient: !!client,
      });
    }
  }, [client, network]);
  return null;
}
