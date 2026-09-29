/**
 * RevenueCat: one "family" entitlement, sold as monthly / yearly packages
 * (with an intro trial) plus an optional lifetime package.
 *
 * Keys come from env so the repo stays key-free:
 *   EXPO_PUBLIC_RC_TEST_KEY    – RevenueCat Test Store key (dev builds)
 *   EXPO_PUBLIC_RC_IOS_KEY     – App Store key (release)
 *   EXPO_PUBLIC_RC_ANDROID_KEY – Play Store key (release)
 */
import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  LOG_LEVEL,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { create } from 'zustand';

export const ENTITLEMENT = 'family';

type PurchaseState = {
  configured: boolean;
  pro: boolean;
  offering: PurchasesOffering | null;
  loading: boolean;
  error: string | null;
};

export const usePurchases = create<PurchaseState>(() => ({
  configured: false,
  pro: false,
  offering: null,
  loading: false,
  error: null,
}));

export const usePro = () => usePurchases((s) => s.pro);

function apiKey(): string | undefined {
  const platformKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
    android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  });
  // Test Store keys crash release builds on purpose, so only use them in dev.
  if (__DEV__ && process.env.EXPO_PUBLIC_RC_TEST_KEY) return process.env.EXPO_PUBLIC_RC_TEST_KEY;
  return platformKey || undefined;
}

function applyCustomerInfo(info: CustomerInfo) {
  usePurchases.setState({ pro: info.entitlements.active[ENTITLEMENT] !== undefined });
}

export async function initPurchases(): Promise<void> {
  const key = apiKey();
  if (!key || usePurchases.getState().configured) return;
  try {
    if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey: key });
    usePurchases.setState({ configured: true });
    Purchases.addCustomerInfoUpdateListener(applyCustomerInfo);
    applyCustomerInfo(await Purchases.getCustomerInfo());
    void loadOffering();
  } catch (e) {
    usePurchases.setState({ error: String(e) });
  }
}

export async function loadOffering(): Promise<void> {
  if (!usePurchases.getState().configured) return;
  usePurchases.setState({ loading: true, error: null });
  try {
    const offerings = await Purchases.getOfferings();
    usePurchases.setState({ offering: offerings.current, loading: false });
  } catch (e) {
    usePurchases.setState({ loading: false, error: String(e) });
  }
}

/** Returns true when the purchase unlocked Family. */
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    applyCustomerInfo(customerInfo);
    return customerInfo.entitlements.active[ENTITLEMENT] !== undefined;
  } catch (e) {
    const err = e as { userCancelled?: boolean | null; message?: string };
    if (!err.userCancelled) usePurchases.setState({ error: err.message ?? String(e) });
    return false;
  }
}

export async function restore(): Promise<boolean> {
  if (!usePurchases.getState().configured) return false;
  try {
    const info = await Purchases.restorePurchases();
    applyCustomerInfo(info);
    return info.entitlements.active[ENTITLEMENT] !== undefined;
  } catch (e) {
    usePurchases.setState({ error: String(e) });
    return false;
  }
}

export async function openCustomerCenter(): Promise<void> {
  if (!usePurchases.getState().configured) return;
  await RevenueCatUI.presentCustomerCenter();
}

/** Human-friendly trial length, e.g. 7 for a one-week intro offer. */
export function trialDays(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price > 0) return null;
  const unit = intro.periodUnit.toUpperCase();
  const n = intro.periodNumberOfUnits;
  if (unit.startsWith('DAY')) return n;
  if (unit.startsWith('WEEK')) return n * 7;
  if (unit.startsWith('MONTH')) return n * 30;
  return null;
}
