import { signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

declare const sodium: any;

const wallet = signal<undefined | Record<string, any>>(undefined);
const validHash = signal<undefined | boolean>(undefined);
const validWallet = signal<undefined | boolean>(undefined);
const pin = signal<undefined | any>(undefined);
const recoveryPhrase = signal<undefined | any>(undefined);

export default function ToastCracker() {
  const initialValue =
    'a988deb6{"walletversion":"1.0","pindata":{"salt":"80a6c7d311a80e1739de65217e55ccec3ed49845","hash":"62f5efa02ba1ea206f5f0498"},"ppdata":{"salt1":"0ff70abfc4662cc9c8f33bc51c07eaba3645bad012b913af88130a5b842b9be5d65e37fc","salt2":"f4ba3246f26d90577e3c943cc15561ea7b628cc0479da3d6c32ddd6971c376708b7cd2a9","hash":"a0ed7d0707ae5a65624416365647ec8c594ca596"},"rpdata":{"salt1":"109f0f7f7db145b8cbc9a461f5219e60e304a1967e50d414f6e17a5c6551153c685886e2","salt2":"668f0852c8a09b266daa2f9ee880b5657242af07348ad355bcac8483dd447f4dca78089e","hash":"7b8907078aeb4f757378f74c56a8769e3335a2af","erk":"a75ac8a242325d222dbe5e487452b5d8639b43f2998932ec95fb2b7826c75b093e6a2d7ae06d128dfde23c43440527b4d405cef23bd0f897e48abbe4"},"accounts":{"rH74HasZ84oGzcnuhMtW8GXTwZLdKdckHw":{"ppsalt":"b8e258e9696294e7130b0f99889ade93c0b92c3f7d7a1c9acd6ae88799e5c10d747afe2b","ppsecret":"5101ecc3d314bbc6a170775400004efdc083264f6974d2bda01085ca943b19d98ead12342afdce8d9cd20b4838a7246b48bcc732c3b76763453cecb4ec3f89218eb2f01a01101a2b3b","rpsalt":"bbb6992afff12577486afad91b6c80b2f0f13e81e594ceb365050016ef525a285c573fd6","rpsecret":"e9c8da32cefc93326a3f2b87b68ea171ff42b0bf9e4e6fee162997469a30f93a2e93f1e0953935d014cc7913a631a3d2f70ab60e44aae059e286ef228e699a59cc4d685ae1e15ec740","nickname":"test"}}}';

  return (
    <>
      <div class="gap-2 py-6">

      <p class="my-4 text-center">Paste backup here:
        </p>
        <textarea id="recovery" value={initialValue}></textarea>
      </div>

      <div class="gap-2 py-6">
        <Button
            type="submit"
            onClick={() => {
              crackWallet(document.getElementById("recovery")!.value);
            }}
          >
            Start
        </Button>
      </div>
      {wallet.value &&
        (
          <div class="gap-8 py-6">
            <p class="my-4 text-center">
              <b>
                Valid hash:{" "}
                <span
                  style={{
                    color: validHash.value ? "lightgreen" : "red",
                  }}
                >
                  {validHash.value.toString()}
                </span>
              </b>
            </p>
            <p class="my-4 text-center">
              <b>
                Valid wallet:{" "}
                <span
                  style={{
                    color: validWallet.value ? "lightgreen" : "red",
                  }}
                >
                  {validWallet.value.toString()}
                </span>
              </b>
            </p>
            <p class="my-4 text-center">
              <b>Accounts: {wallet.value.accounts.length}</b>
              <ul>
                {Object.values(wallet.value.accounts).map((acc) => (
                  <li>{acc.nickname}</li>
                ))}
              </ul>
            </p>
          <p class="my-4 text-center">
            <b>
              Pin: </b>{pin.value || 'Loading...'}
            
          </p>
          </div>
        )}
    </>
  );

  async function crackWallet(file: string) {
    const walletFileCleaned = ("" + file).trim();
    const hash = walletFileCleaned.slice(0, 8);
    const walletStr = walletFileCleaned.slice(8);

    if (hash !== sodium.crypto_generichash(4, walletStr, "", "hex")) {
      console.error("Invalid hash");
      validHash.value = false;
      return;
    }
    const _wallet = JSON.parse(walletStr);

    if (
      _wallet.pindata == undefined || _wallet.ppdata == undefined ||
      _wallet.rpdata == undefined || _wallet.accounts == undefined
    ) {
      console.error("Invalid wallet");
      validWallet.value = false;
      return;
    }

    validHash.value = true;
    validWallet.value = true;

    wallet.value = _wallet;

    const _pin = await crackPin(wallet.value!.pindata);
    pin.value = _pin

    return

    const _recoveryPhrase = await crackRecoveryPhrase(_wallet.rpdata);
    console.log("Recovery passphrase: ", _recoveryPhrase);
    recoveryPhrase.value = _recoveryPhrase
  }

  function crackPin(pindata: any) {
    console.time("Got pin");
    return new Promise((resolve, reject) => {
      const workers = new Array(10).fill(null).map((_, i) => {
        console.log('Starting worker')
        const worker = new Worker("/pin-worker.js");
        worker.addEventListener("message", (e) => {
          workers.forEach((w) => w.terminate());
          console.timeEnd("Got pin");
          resolve(e.data);
        });
        worker.addEventListener("start", console.log);
        worker.addEventListener("error", console.error);
        worker.addEventListener("exit", (code) => {
          if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
          }
        });
        worker.postMessage({
          workerData: { pindata, start: i * 100000 },
        });
        return worker;
      });
    });
  }


  /**
   * 
   * @param {{
   *  salt1: string,
  *  salt2: string,
  *  hash: string
  *}} rpdata 
  */
  function crackRecoveryPhrase(rpdata) {
    console.time('Got recovery passphrase')
    return new Promise((resolve, reject) => {
        const workers = new Array(24).fill(null).map((_, i) => {
            const worker = new Worker('/recovery-phrase-worker.js');
              worker.addEventListener('message', (e) => {
                workers.forEach(w => w.terminate())
                console.timeEnd('Got recovery passphrase')
                resolve(e.data)
              });
              worker.addEventListener('error', console.error);
              worker.addEventListener('exit', (code) => {
                if (code !== 0)
                  console.error(new Error(`Worker stopped with exit code ${code}`));
              });
              worker.postMessage({
                workerData: { rpdata, start: Math.floor(i) }
              });
              return worker
        })
    })

  }
}
