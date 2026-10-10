import "@server/env";

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const pin = body && typeof body === "object" && "pin" in body && typeof body.pin === "string"
    ? body.pin
    : "";
  const expectedPin = process.env.DESK_PIN?.trim() || "1234";
  if (pin !== expectedPin) {
    return Response.json({ error: "That staff PIN is not correct." }, { status: 401 });
  }
  return Response.json({ ok: true });
}
