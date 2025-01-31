# This file is part of BenchExec, a framework for reliable benchmarking:
# https://github.com/sosy-lab/benchexec
#
# SPDX-FileCopyrightText: 2007-2020 Dirk Beyer <https://www.sosy-lab.org>
#
# SPDX-License-Identifier: Apache-2.0

from benchexec.tools.template import UnsupportedFeatureException
from benchexec.tools.sv_benchmarks_util import get_data_model_from_task, ILP32, LP64
import re

coveriteam = __import__(
    "benchexec.tools.coveriteam-verifier-validator", fromlist=["Tool"]
)


class Tool(coveriteam.Tool):
    """
    Tool infor for Graves, a verifier selector based on Graph Neural Networks
    We inherit Coveriteam's infrastructure.
    URL: https://github.com/mgerrard/graves-par
    """

    REQUIRED_PATHS = [
        "coveriteam",
        "bin",
        "lib",
        "depends",
        "predict",
        "predict/build",
    ]

    def name(self):
        return "Graves-Par"

    def executable(self, tool_locator):
        return tool_locator.find_executable("graves.sh")

    def cmdline(self, executable, options, task, rlimits):
        """
        Graves-PAR takes in three arguments: the program looking to be verified,
        a property file, and the data model. From their it forms its prediction
        """

        options += [task.single_input_file]

        if task.property_file:
            options += [task.property_file]
        else:
            raise UnsupportedFeatureException(
                "Can't execute Graves: Specification is missing."
            )

        data_model_param = get_data_model_from_task(
            task, {ILP32: "ILP32", LP64: "LP64"}
        )
        if data_model_param and not any(
            re.match("data_model *=", option) for option in options
        ):
            options += [data_model_param]

        return [executable] + options

    def program_files(self, executable):
        return self._program_files_from_executable(
            executable, self.REQUIRED_PATHS, parent_dir=False
        )
