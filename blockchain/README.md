# Contrato AcademicSBT

Compila el contrato ubicado en `blockchain/contracts/AcademicSBT.sol`.

```powershell
pnpm install
pnpm compile
pnpm test
```

Para desplegarlo en Sepolia, exporta `SEPOLIA_RPC_URL` y `DEPLOYER_PRIVATE_KEY` en la sesión, consigue ETH de prueba para esa cuenta y ejecuta `pnpm deploy:sepolia`. Copia la dirección mostrada a `attendance/.env` como `BLOCKCHAIN_CONTRACT_ADDRESS`; configura además `BLOCKCHAIN_RPC_URL` y `BLOCKCHAIN_PRIVATE_KEY` (la misma cuenta propietaria del contrato). Mantén `BLOCKCHAIN_CHAIN_ID=11155111`.

Mainnet utiliza el mismo contrato y configuración independiente: `MAINNET_RPC_URL`, nueva dirección de contrato y `BLOCKCHAIN_CHAIN_ID=1`. Nunca reutilices direcciones de contrato de una red en la otra.
