import {
    ActorProvider,
    createActorContext,
    createUseActorHook,
    isIdentityExpiredError,
  } from "ic-use-actor";
  import {
    canisterId,
    idlFactory,
  } from "../../../declarations/ckbtc_ledger/index.js";
  import React from "react";
  import { useInternetIdentity } from "ic-use-internet-identity";
  import { toast } from "react-toastify";
  
  const HOST = (process.env.DFX_NETWORK !== "ic") ? "http://localhost:4943" : "https://icp-api.io";

  const actorCkbtc = createActorContext();
  export const useCkbtcBackend = createUseActorHook(actorCkbtc);
  
  const CkbtcActor = ({ children }) => {
    const { identity: iiIdentity, clear } = useInternetIdentity();
  
    const handleRequest = (data) => {
      // console.log("onRequest", data.args, data.methodName);
      return data.args;
    };
  
    const handleResponse = (data) => {
      // console.log("onResponse", data.args, data.methodName, data.response);
      return data.response;
    };
  
    const handleRequestError = (data) => {
      console.log("onRequestError", data.args, data.methodName, data.error);
      return data.error;
    };
  
    const handleResponseError = (data) => {
      console.log("onResponseError", data.args, data.methodName, data.error);
      if (isIdentityExpiredError(data.error)) {
        console.log('Identity expired error');
clear();
window.location.reload()
        return;
      }
    };


    return (
      <ActorProvider
        httpAgentOptions={{ host: HOST }}
        canisterId={canisterId}
        context={actorCkbtc}
        identity={iiIdentity}
        idlFactory={idlFactory}
        onRequest={handleRequest}
        onResponse={handleResponse}
        onRequestError={handleRequestError}
        onResponseError={handleResponseError}
      >
        {children}
      </ActorProvider>
    );
  }
  
  export default CkbtcActor;
  