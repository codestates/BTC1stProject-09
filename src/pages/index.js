import * as React from "react";
import styled from "styled-components";
import vCard from "vcf";
import { AuthClient } from "@dfinity/auth-client";
import {
  key_new,
  key_to_pub_key,
  address_to_hex,
} from "@dfinity/rosetta-client";
import utils from "../utils";
import { Principal } from "@dfinity/principal";

// For NNS
const bip39 = require("bip39");
const IC_NNS_DOMAIN = "https://identity.ic0.app/";

// styles
const Main = styled.main`
  color: "#232129";
  padding: 96;
  font-family: "-apple-system, Roboto, sans-serif, serif";
  width: fit-content;

  fieldset,
  label {
    display: flex;
    flex-direction: column;
  }
  input {
    min-width: 280px;
    width: fit-content;
  }
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
    /* width: fit-content; */
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
  const [mnemonic] = React.useState(bip39.generateMnemonic());
  const [address, setAddress] = React.useState("abc");

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
      debugger;
      const text = await window.customModule.basic_ic_wallet.p2a(
        id.getPrincipal()
      );

      setActor(module.basic_ic_wallet);

      // const id = await authClient.getIdentity();
      // const principal = id.getPrincipal();
      // console.log(principal);
      // const address = await actor?.accountIdentifier(principal);
      // console.log(address);
      // setAddress(address);
      // const principal = authClient.getIdentity((id) => {
      //   id.getPrincipal((principal) => {
      //     actor?.p2a(principal).then((account) => {
      //       console.log("Finally, your address is", account);
      //       setAddress(account);
      //     });
      //   });
      // });
    }
  }, []);

  async function handleAuthenticated(authClient) {
    const id = await authClient.getIdentity();
    // debugger;
    console.log("id in handleAuthenticated: ", id);
    setIdentifier(id);
    window.identity = id;
    return;
  }

  function handleSubmit(e) {
    // setAddress(identifier);
    // console.info("User's whoami:", actor?.whoami());
    // alert(actor?.whoami());
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
      <title>Contact Book</title>
      <h1>Internet Computer Address Book</h1>
      <section>
        <h2>Look up a contact by email</h2>
        <form onSubmit={getCard}>
          <label htmlFor="emailsearch">
            <input type="email" name="emailsearch" id="emailsearch" />
          </label>
          <button type="submit">Search</button>
        </form>
      </section>
      {/* Card Display */}
      <ContactCard card={card} />

      <h1>Here is your generated ICP token address: </h1>
      <h2>{address}</h2>

      <form onSubmit={handleSubmit}>
        <h2>Add a Contact</h2>
        <fieldset>
          <h3>Personal Information</h3>
          <label htmlFor="n">
            Full Name
            <input type="text" name="n" autoComplete="name" />
          </label>
          <label htmlFor="org">
            Organziation
            <input type="text" name="org" autoComplete="organization" />
          </label>
          <label htmlFor="title">
            Title
            <input type="text" name="title" autoComplete="organization-title" />
          </label>
        </fieldset>
        <fieldset>
          <h3>Profile photo</h3>
          <label htmlFor="photo">
            Upload an image
            <input
              type="file"
              id="img"
              name="photo"
              accept="image/*"
              onChange={handleUpload}
            />
          </label>
          {image ? (
            <ProfilePicture>
              <img src={image} alt="user-uploaded profile image" />
            </ProfilePicture>
          ) : null}
        </fieldset>
        <fieldset>
          <h3>Contact</h3>
          <label htmlFor="tel">
            Phone number
            <input type="text" name="tel" />
          </label>
          <label htmlFor="adr">
            Address
            <input type="text" name="adr" autoComplete="on" />
          </label>
          <label htmlFor="email">
            Email
            <input required type="email" name="email" autoComplete="email" />
          </label>
        </fieldset>
        <button type="submit">Submit Contact</button>
      </form>
    </Main>
  );
};

export default IndexPage;
