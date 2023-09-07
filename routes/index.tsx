import IncognitoWarning from "../islands/IncognitoWarning.tsx";
import ToastCracker from "../islands/ToastCracker.tsx";

export default function Home() {
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to Toast Cracker</h1>
        <p class="my-4 text-center">
          Toast Cracker allows you to access your Toast Wallet funds if you forgot your password
        </p>
        <p class="my-4 text-center">
          Please do not use if you don't own the account
        </p>
        <p class="my-4 text-center" >
          If you appreciate my work you can send me BTCs to <span style="word-break: break-all;">0363d791783ea371b438cb4bde67c43c341e9db0a1e92e8ec25f6f8d59c73ba06a</span>
        </p>
        <IncognitoWarning />
        <ToastCracker />
      </div>
    </div>
  );
}
