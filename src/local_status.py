import json
import sys

import tinytuya


def load_entry(config):
    with open(config["device_file"], encoding="utf-8") as device_file:
        devices = json.load(device_file)
    if not isinstance(devices, list):
        raise ValueError("Die Geraeteliste hat ein ungueltiges Format.")
    matches = [
        device for device in devices
        if isinstance(device, dict) and device.get("id") == config["device_id"]
    ]
    if len(matches) != 1 or not isinstance(matches[0].get("key"), str) or not matches[0]["key"]:
        raise ValueError("Geraet oder Local Key wurde in der Geraeteliste nicht gefunden.")

    return matches[0]


def map_status(dps, entry):
    mapping = entry.get("mapping")
    if not isinstance(mapping, dict):
        mapping = {}
    status = []
    for dp, value in dps.items():
        metadata = mapping.get(str(dp))
        code = metadata.get("code") if isinstance(metadata, dict) else None
        status.append({
            "code": code if isinstance(code, str) and code else "DP {}".format(dp),
            "value": value,
        })
    return status


def read_status(config):
    entry = load_entry(config)
    device = tinytuya.Device(
        entry["id"], config["device_ip"], entry["key"],
        version=float(config["version"]), connection_timeout=5,
        connection_retry_limit=1, connection_retry_delay=1,
    )
    result = device.status()
    if not isinstance(result, dict) or not isinstance(result.get("dps"), dict):
        code = result.get("Err", "unbekannt") if isinstance(result, dict) else "unbekannt"
        raise ValueError("Lokale Statusabfrage fehlgeschlagen (TinyTuya-Code: {}).".format(code))

    return {"status": map_status(result["dps"], entry), "functions": [], "mode": "local"}


def main():
    try:
        config = json.load(sys.stdin)
        print(json.dumps(read_status(config), ensure_ascii=False))
    except (OSError, ValueError, KeyError, TypeError) as error:
        if isinstance(error, OSError):
            message = "Geraeteliste nicht lesbar oder lokale Verbindung fehlgeschlagen."
        else:
            message = str(error)
        print(json.dumps({"error": message}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
