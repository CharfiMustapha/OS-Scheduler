#include <stdio.h>
#include "../include/scheduler.h"
#include "../include/process.h"

void fifo(Process p[], int n);
void round_robin(Process p[], int n, int quantum);
void priority_preemptive(Process p[], int n);
void priority_nonpreemptive(Process p[], int n);
void multilevel(Process p[], int n, int quantum);
void sjf(Process p[], int n);
void srtf(Process p[], int n);

void run_scheduler(int policy, Process p[], int n, int quantum) {
    switch(policy) {
        case 1: fifo(p, n); break;
        case 2: round_robin(p, n, quantum); break;
        case 3: priority_preemptive(p, n); break;
        case 4: multilevel(p, n, quantum); break;
        case 5: sjf(p, n); break;
        case 6: priority_nonpreemptive(p, n); break;
        case 7: srtf(p, n); break;
        default: printf("Choix invalide.\n");
    }
}


