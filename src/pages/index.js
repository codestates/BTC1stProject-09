import * as React from "react";
import styled from "styled-components";
import vCard from "vcf";
import { AuthClient } from "@dfinity/auth-client";
import RosettaApi, { RosettaError } from "../utils/rosettaApi";
import BigNumber from "bignumber.js";

// For NNS
const IC_NNS_DOMAIN = "https://identity.ic0.app/";

// styles
const Main = styled.main`
  color: "#232129";
  padding: 96;
  font-family: "-apple-system, Roboto, sans-serif, serif";

  fieldset,
  label {
    display: flex;
    flex-direction: column;
  }
  input {
    min-width: 280px;
  }
`;

const IcWallet = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  margin-top: 330px;
  font: caption;
`;

const Title = styled.h1`
  font-size: 20px;
`;

const ProfilePicture = styled.picture`
  display: flex;
  width: 256px;
  img {
    width: 100%;
  }
`;

const DataList = styled.dl`
  display: grid;
  grid-template-columns: auto auto;
  dt,
  dd {
    display: inline-flex;
    border: 1px solid black;
    padding: 4px;
    margin: 0;
    padding-right: 16px;
  }
  picture,
  image {
    max-width: 75px;
  }
`;

const ContactCard = ({ card }) => {
  if (!card || !card.data) return null;
  return (
    <section>
      <DataList>
        {Object.entries(card.data).map(([key, value]) => {
          const [_field, _data] = value;
          console.log(value);
          if (_field === "photo") {
            return (
              <React.Fragment key={_field}>
                <dt>{_field}</dt>
                <dd>
                  <ProfilePicture>
                    <img
                      style={{ maxWidth: "75px" }}
                      src={atob(_data)}
                      alt="profile"
                    />
                  </ProfilePicture>
                </dd>
              </React.Fragment>
            );
          } else {
            return (
              <>
                <dt>{_field}</dt>
                <dd>{_data}</dd>
              </>
            );
          }
        })}
      </DataList>
      <a
        href={`data:text/plain;charset=utf-8,${encodeURIComponent(
          card.toString()
        )}`}
        download="contact.vcf"
      >
        Download VCF
      </a>
    </section>
  );
};

// markup
const IndexPage = () => {
  const [image, setImage] = React.useState("");
  const [card, setCard] = React.useState(null);
  const [actor, setActor] = React.useState(null);
  const [identifier, setIdentifier] = React.useState(null);
  const [address, setAddress] = React.useState("Loading.....");
  const [accountBalance, setAccountBalance] = React.useState("Loading.....");

  // Initialize the app here
  React.useEffect(async () => {
    let authClient = await AuthClient.create();
    try {
      if (await authClient.isAuthenticated()) {
        console.info("This user is already NNS authenticated");
        handleAuthenticated(authClient);
      } else {
        // Redirect to NNS authentication for brand new users
        await authClient.login({
          identityProvider: IC_NNS_DOMAIN,
          onSuccess: async () => {
            const id = await authClient.getIdentity().getPublicKey();
            setIdentifier(id);

            console.info("Identifier is successfully set:", id);
          },
        });
      }
    } catch (e) {
      console.error("Error found while initializing basic_ic_wallet:", e);
    } finally {
      console.log("finally hook");
      // Set the Actor for communicating with IC network
      const module = await import("../declarations/basic_ic_wallet");
      window.customModule = module;
      const id = await authClient.getIdentity();
      const address = await window.customModule.basic_ic_wallet.p2a(
        id.getPrincipal()
      );
      setAddress(address);
      window.ic_address = address;
      setActor(module.basic_ic_wallet);

      const rosettaApi = new RosettaApi();
      if (address) {
        const accountBalance = await rosettaApi.getAccountBalance(address);
        let targetBalance = new BigNumber(accountBalance).c[0] / 100000000;

        setAccountBalance(targetBalance);
        window.ic_account_balance = accountBalance;
      }
    }
  }, []);

  async function handleAuthenticated(authClient) {
    const id = await authClient.getIdentity();
    console.log("id in handleAuthenticated: ", id);
    setIdentifier(id);
    window.identity = id;
    return;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const card = new vCard();
    const inputs = e.target.querySelectorAll("input");
    const email = e.target.querySelector('input[name="email"]').value;
    inputs.forEach((input) => {
      if (input.name === "photo") return;
      else if (input.name === "n") {
        // Take full input and format for vcf
        const names = input.value.split(" ");
        const arr = new Array(5);

        names.reverse().forEach((name, idx) => {
          arr[idx] = name;
        });

        card.add("fn", input.value);
        card.add(input.name, arr.join(";"));
      } else {
        card.add(input.name, input.value);
      }
    });
    card.add("photo", btoa(image), { mediatype: "image/gif" });

    actor?.set(email, JSON.stringify(card.toJSON())).then(() => {
      alert("card uploaded!");
      inputs.forEach((input) => {
        input.value = "";
      });
      setImage("");
    });

    console.log("After submit: id", identifier);
    identifier.getPrincipal((principal) => {
      console.log("After submit: principal", principal);
      actor?.accountIdentifier(principal).then((account) => {
        console.log("Finally, your address is", account);
        setAddress(account);
        window.ic_address = address;
      });
    });

    return false;
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      function () {
        // convert image file to base64 string
        setImage(reader.result);
      },
      false
    );

    if (file) {
      reader.readAsDataURL(file);
    }
  }

  function getCard(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[name="emailsearch"]').value;

    actor?.get(email).then((returnedCard) => {
      if (!returnedCard.length) {
        return alert("No contact found for that email");
      }
      setCard(vCard.fromJSON(returnedCard[0]));
      console.log(returnedCard);
    });
    return false;
  }

  return (
    <Main>
      <IcWallet>
        <title>Simple IC Wallet</title>
        <h1>Internet Computer Simple Wallet</h1>
        {/* Card Display */}
        <ContactCard card={card} />

        <Title>Here is your generated ICP token address: </Title>
        <span>{address}</span>
        <br></br>
        <Title>Account Balance: </Title>
        <span>{accountBalance} ICP</span>
      </IcWallet>
    </Main>
  );
};

export default IndexPage;
