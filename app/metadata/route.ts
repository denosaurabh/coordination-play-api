import pinataSDK from "@pinata/sdk";
import { Readable } from "stream";

export async function POST(request: Request): Promise<Response> {
  const resOptions: RequestInit = {
    headers: {
      "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "",
    },
  };

  try {
    const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_API_JWT });

    const formData = await request.formData();
    const logo = formData.get("logo") as Blob;
    const name = formData.get("name");

    if (!logo) {
      console.error("no logo!");

      return Response.json(
        { message: "No logo received." },
        { ...resOptions, status: 400 }
      );
    }

    // hashed name
    const nameHash = name?.toString().replaceAll(" ", "-");

    const logoBuffer = Buffer.from(await logo.arrayBuffer());
    // logo
    const logoRes = await pinata.pinFileToIPFS(Readable.from(logoBuffer), {
      pinataMetadata: {
        name: `${nameHash}-logo`,
      },
    });

    // metadata
    const metadataRes = await pinata.pinJSONToIPFS(
      {
        logo: logoRes.IpfsHash,
        name,
        description: formData.get("description"),
        socials: {
          website: formData.get("website"),
          discord: formData.get("discord"),
        },
      },
      {
        pinataMetadata: {
          name: `${nameHash}-metadata`,
        },
      }
    );

    return Response.json({ cid: metadataRes.IpfsHash }, resOptions);
  } catch (err) {
    console.log("metadata err", err);
    return Response.json(
      { message: "Error uploading file" },
      { ...resOptions, status: 500 }
    );
  }
}
