import json
import queue
import sys
import threading
import time
import uuid

import tinytuya

from local_status import load_entry, map_status


def emit(message):
    print(json.dumps(message, ensure_ascii=False), flush=True)


def emit_update(dps, entry):
    event = {"type": "update", "status": map_status(dps, entry), "fault": dps.get("109")}
    if "111" in dps:
        event["visit"] = dps["111"]
    emit(event)


def handle_command(device, entry, line, connection):
    try:
        request = json.loads(line)
    except (ValueError, TypeError):
        emit({"type": "error", "error": "Ungueltige interne Befehlsanfrage."})
        return
    if not isinstance(request, dict) or not isinstance(request.get("id"), str):
        emit({"type": "error", "error": "Ungueltige interne Befehlsanfrage."})
        return
    result = {"type": "command-result", "id": request["id"]}
    action = request.get("action")
    counters = {"set-litter-days": (105, 30), "set-box-days": (126, 14)}
    if not isinstance(action, str) or (action not in counters and action != "reset-deodorant"):
        result["error"] = "Unbekannter Befehl."
    elif action in counters and (
        type(request.get("days")) is not int or not 0 <= request["days"] <= counters[action][1]
    ):
        result["error"] = "Ungueltige Tageszahl; Befehl nicht gesendet."
    elif request.get("connection") != connection:
        result["error"] = "Verbindung hat sich geaendert; Befehl nicht gesendet."
    elif not isinstance(request.get("expiresAt"), (int, float)) or time.time() * 1000 >= request["expiresAt"]:
        result["error"] = "Befehl abgelaufen und nicht gesendet."
    else:
        dp, value = (124, True) if action == "reset-deodorant" else (counters[action][0], request["days"])
        device.set_socketRetryLimit(0)
        try:
            response = device.set_value(dp, value, nowait=True)
        finally:
            device.set_socketRetryLimit(1)
        if isinstance(response, dict) and isinstance(response.get("dps"), dict):
            emit_update(response["dps"], entry)
        if response is None:
            result["ok"] = True
        elif isinstance(response, dict) and "Err" in response:
            result["error"] = "Geraetebefehl fehlgeschlagen (TinyTuya-Code: {}). Erfolg unklar.".format(response["Err"])
        else:
            result["error"] = "Keine eindeutige Antwort. Der Befehl koennte trotzdem gesendet worden sein."
    emit(result)


def read_commands(commands):
    for line in sys.stdin:
        commands.put(line)


def monitor(config, commands):
    entry = load_entry(config)
    while True:
        device = tinytuya.Device(
            entry["id"], config["device_ip"], entry["key"],
            version=float(config["version"]), connection_timeout=5,
            connection_retry_limit=1, connection_retry_delay=1,
        )
        device.set_socketPersistent(True)
        try:
            result = device.status()
            if not isinstance(result, dict) or not isinstance(result.get("dps"), dict):
                code = result.get("Err", "unbekannt") if isinstance(result, dict) else "unbekannt"
                emit({"type": "error", "error": "Lokale Verbindung fehlgeschlagen (TinyTuya-Code: {}).".format(code)})
            else:
                connection = uuid.uuid4().hex
                emit({"type": "connected", "connection": connection, "status": map_status(result["dps"], entry), "fault": result["dps"].get("109")})
                heartbeat_at = time.monotonic() + 10
                while True:
                    try:
                        command = commands.get_nowait()
                    except queue.Empty:
                        command = None
                    if command is not None:
                        handle_command(device, entry, command, connection)
                    if time.monotonic() >= heartbeat_at:
                        result = device.heartbeat()
                        if isinstance(result, dict) and "Err" in result:
                            emit({"type": "error", "error": "Lokale Verbindung unterbrochen (TinyTuya-Code: {}).".format(result["Err"])})
                            break
                        heartbeat_at = time.monotonic() + 10
                    result = device.receive()
                    if isinstance(result, dict) and "Err" in result:
                        emit({"type": "error", "error": "Lokale Verbindung unterbrochen (TinyTuya-Code: {}).".format(result["Err"])})
                        break
                    if isinstance(result, dict) and isinstance(result.get("dps"), dict):
                        emit_update(result["dps"], entry)
        finally:
            device.close()
        time.sleep(10)


def main():
    try:
        config = json.loads(sys.stdin.readline())
        commands = queue.Queue()
        threading.Thread(target=read_commands, args=(commands,), daemon=True).start()
        monitor(config, commands)
    except (OSError, ValueError, KeyError, TypeError) as error:
        if isinstance(error, OSError):
            message = "Geraeteliste nicht lesbar oder lokale Verbindung fehlgeschlagen."
        else:
            message = str(error)
        emit({"type": "error", "error": message})
        sys.exit(1)


if __name__ == "__main__":
    main()
