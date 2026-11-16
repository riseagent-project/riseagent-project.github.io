# Open hospital asset attribution

These models are published by Open Robotics on Gazebo Fuel under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Source authors are retained below. No endorsement by the creators is implied.

| Model | Source author | Pinned version | Source |
| --- | --- | --- | --- |
| BPCart | Open Robotics (publisher; source author unspecified) | 2 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/BPCart) |
| BedsideTable | Cole Biesemeyer | 2 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/BedsideTable) |
| IVStand | Open Robotics (publisher; source author unspecified) | 2 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/IVStand) |
| InstrumentCart1 | name | 2 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/InstrumentCart1) |
| SurgicalTrolley | Roselle Carmen | 2 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/SurgicalTrolley) |
| TrolleyBed | Wan Yi Seow | 3 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/TrolleyBed) |
| WhiteChipChair | Wan Yi Seow | 3 | [Gazebo Fuel](https://app.gazebosim.org/OpenRobotics/fuel/models/WhiteChipChair) |

Modifications: converted OBJ/MTL to USD Preview Surface; split material meshes, uniformly scaled to metric dimensions, centered and grounded, rotated to scene coordinates, adjusted material roughness, and added simplified invisible navigation collision proxies. Original source geometry and textures are preserved under `simulation/scene/static/shared_assets/curated/sources/gazebo/`; each `provenance.json` records the API license metadata, version and downloaded archive SHA-256.

Placement: three-seat waiting modules; transfer beds in examination rooms; IV stands and bedside cabinets in wards; surgical supply trolleys; instrument carts; one blood-pressure cart in cardiology. Ward bed bodies and diagnostic scanners remain procedural.

Reproduction: run `acquire_gazebo_hospital.py`, Blender `convert_gazebo_hospital.py`, then `python -m simulation.scene.logic.builders.buildings.hospital_open_assets`. The hospital generator invokes the final replacement step automatically.

Validation scope: USD dependencies, source textures, model dimensions, placement idempotence, campus bridge clearance and task bindings. These are static furnishings, not articulated medical-device simulations.
